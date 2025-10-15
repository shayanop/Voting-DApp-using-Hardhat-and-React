import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { connectWallet, fetchCandidates, getRemainingSeconds, getSignerAndContract, isAdmin, type Candidate } from './lib/eth'
import { CONTRACT_ADDRESS, STUDENT_NAME } from './config'

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h ${m}m ${sec}s`
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const anyErr = err as { message?: string; shortMessage?: string }
    return anyErr.shortMessage || anyErr.message || 'Unexpected error'
  }
  try {
    return String(err)
  } catch {
    return 'Unexpected error'
  }
}

function App() {
  const [account, setAccount] = useState<string>('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedId, setSelectedId] = useState<bigint | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [newCandidate, setNewCandidate] = useState('')
  const [remaining, setRemaining] = useState<number>(0)
  const [winnerName, setWinnerName] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  const disabled = useMemo(() => remaining === 0 || winnerName !== '', [remaining, winnerName])

  async function bootstrap() {
    try {
      const addr = await connectWallet()
      setAccount(addr)
      const { contract } = await getSignerAndContract()
      const list = await fetchCandidates(contract)
      setCandidates(list)
      setIsOwner(await isAdmin(contract, addr))
      try {
        setRemaining(await getRemainingSeconds(contract))
      } catch (err: unknown) {
        console.error('Failed to fetch remaining time', err)
      }
      try {
        const ended = await contract.getVotingStatus()
        if (ended[0]) {
          const name = await contract.getWinnerName()
          setWinnerName(name)
        }
      } catch (err: unknown) {
        console.error('Failed to fetch status/winner', err)
      }
      contract.on('VoteCast', async () => {
        const listNow = await fetchCandidates(contract)
        setCandidates(listNow)
      })
      contract.on('VotingEnded', async () => {
        const name = await contract.getWinnerName()
        setWinnerName(name)
        setRemaining(0)
      })
    } catch (e: unknown) {
      setStatus(getErrorMessage(e))
    }
  }

  useEffect(() => {
    // manual connect via button to ensure MetaMask prompt appears
  }, [])

  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [remaining])

  async function handleVote() {
    if (!selectedId) return
    setStatus('Sending vote...')
    try {
      const { contract } = await getSignerAndContract()
      const tx = await contract.vote(selectedId)
      await tx.wait()
      setStatus('Voted successfully')
    } catch (e: unknown) {
      setStatus(getErrorMessage(e) || 'Vote failed')
    }
  }

  async function handleAddCandidate() {
    if (!newCandidate.trim()) return
    setStatus('Adding candidate...')
    try {
      const { contract } = await getSignerAndContract()
      const tx = await contract.addCandidate(newCandidate.trim())
      await tx.wait()
      setNewCandidate('')
      const list = await fetchCandidates(contract)
      setCandidates(list)
      setStatus('Candidate added')
    } catch (e: unknown) {
      setStatus(getErrorMessage(e) || 'Add failed')
    }
  }

  async function handleEndVoting() {
    setStatus('Ending voting...')
    try {
      const { contract } = await getSignerAndContract()
      const tx = await contract.endVoting()
      await tx.wait()
      const name = await contract.getWinnerName()
      setWinnerName(name)
      setRemaining(0)
      setStatus('Voting ended')
    } catch (e: unknown) {
      setStatus(getErrorMessage(e) || 'End failed')
    }
  }

  return (
    <div>
      <div className="glass panel" style={{ marginBottom: 16 }}>
        <div className="title">Shayan Voting DApp</div>
        <div className="meta">
          <div className="badge"><span>Wallet</span><span className="muted">{account || 'Not connected'}</span></div>
          <div className="badge"><span>Contract</span><span className="muted">{CONTRACT_ADDRESS}</span></div>
          <div className="badge"><span>Time Left</span><span className="muted">{remaining > 0 ? formatSeconds(remaining) : 'Voting ended'}</span></div>
          {winnerName && <div className="badge"><span>Winner</span><span className="muted">{winnerName}</span></div>}
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={bootstrap} disabled={!!account}>{account ? 'Connected' : 'Connect MetaMask'}</button>
        </div>
        {CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000' && (
          <div className="muted" style={{ marginTop: 10 }}>Set VITE_CONTRACT_ADDRESS in frontend/.env</div>
        )}
      </div>

      <div className="grid">
        <div className="glass panel">
          <div className="row" style={{ marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>Candidates</h2>
            <div className="muted">Select and vote</div>
          </div>
          {candidates.length === 0 && <div className="muted">No candidates yet</div>}
          <ul>
            {candidates.map(c => (
              <li key={String(c.id)} className="row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="radio" name="candidate" disabled={disabled} onChange={() => setSelectedId(c.id)} />
                  <span>{c.name}</span>
                </label>
                <span className="muted">votes: {String(c.voteCount)}</span>
              </li>
            ))}
          </ul>
          <div className="row" style={{ marginTop: 12 }}>
            <button disabled={disabled || !selectedId} onClick={handleVote}>Vote</button>
            {isOwner && <button className="btn-secondary" disabled={winnerName !== ''} onClick={handleEndVoting}>End Voting</button>}
          </div>
        </div>

        <div className="glass panel">
          <h2 style={{ marginTop: 0 }}>Admin</h2>
          {isOwner ? (
            <div className="row">
              <input value={newCandidate} onChange={e => setNewCandidate(e.target.value)} placeholder="Candidate name" />
              <button onClick={handleAddCandidate}>Add</button>
            </div>
          ) : (
            <div className="muted">Connect as admin to add candidates</div>
          )}
          {status && <div style={{ marginTop: 16 }} className="muted">{status}</div>}
        </div>
      </div>

      <div className="footer">Built by {STUDENT_NAME}</div>
    </div>
  )
}

export default App

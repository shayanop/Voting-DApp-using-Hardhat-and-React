// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting_ShayanAhmed {
    // State variables
    address public admin;
    uint256 public votingEndTime;
    bool public votingEnded;
    uint256 public totalVotes;
    
    // Candidate structure
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }
    
    // Mapping to store candidates
    mapping(uint256 => Candidate) public candidates;
    uint256 public candidatesCount;
    
    // Mapping to track if an address has voted
    mapping(address => bool) public hasVoted;
    
    // Mapping to track votes per candidate
    mapping(uint256 => uint256) public votes;
    
    // Events
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event VotingEnded(uint256 timestamp, uint256 winnerId);
    event CandidateAdded(uint256 indexed candidateId, string name);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier votingActive() {
        require(block.timestamp < votingEndTime, "Voting has ended");
        require(!votingEnded, "Voting has ended");
        _;
    }
    
    modifier onlyAfterEnd() {
        require(block.timestamp >= votingEndTime || votingEnded, "Voting is still active");
        _;
    }
    
    // Constructor
    constructor(uint256 _votingDuration) {
        admin = msg.sender;
        votingEndTime = block.timestamp + _votingDuration;
        votingEnded = false;
        totalVotes = 0;
        candidatesCount = 0;
    }
    
    // Function to add candidates (only admin)
    function addCandidate(string memory _name) public onlyAdmin votingActive {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        candidatesCount++;
        candidates[candidatesCount] = Candidate({
            id: candidatesCount,
            name: _name,
            voteCount: 0
        });
        emit CandidateAdded(candidatesCount, _name);
    }
    
    // Function to vote
    function vote(uint256 _candidateId) public votingActive {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        require(!hasVoted[msg.sender], "You have already voted");
        
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        votes[_candidateId]++;
        totalVotes++;
        
        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }
    
    // Function to end voting early (only admin)
    function endVoting() public onlyAdmin {
        require(!votingEnded, "Voting has already ended");
        votingEnded = true;
        
        uint256 winnerId = getWinner();
        emit VotingEnded(block.timestamp, winnerId);
    }
    
    // Function to get winner
    function getWinner() public view onlyAfterEnd returns (uint256) {
        uint256 maxVotes = 0;
        uint256 winnerId = 0;
        
        for (uint256 i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }
        
        return winnerId;
    }
    
    // Function to get winner name
    function getWinnerName() public view onlyAfterEnd returns (string memory) {
        uint256 winnerId = getWinner();
        if (winnerId == 0) {
            return "No votes cast";
        }
        return candidates[winnerId].name;
    }
    
    // Function to get all candidates
    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidatesCount);
        for (uint256 i = 1; i <= candidatesCount; i++) {
            allCandidates[i - 1] = candidates[i];
        }
        return allCandidates;
    }
    
    // Function to get candidate by ID
    function getCandidate(uint256 _candidateId) public view returns (Candidate memory) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        return candidates[_candidateId];
    }
    
    // Function to get voting status
    function getVotingStatus() public view returns (bool, uint256, uint256) {
        return (votingEnded || block.timestamp >= votingEndTime, block.timestamp, votingEndTime);
    }
    
    // Function to get remaining time
    function getRemainingTime() public view returns (uint256) {
        if (votingEnded || block.timestamp >= votingEndTime) {
            return 0;
        }
        return votingEndTime - block.timestamp;
    }
    
    // Function to get total votes for a candidate
    function getVotesForCandidate(uint256 _candidateId) public view returns (uint256) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        return candidates[_candidateId].voteCount;
    }
    
    // Function to check if user can vote
    function canVote(address _voter) public view returns (bool) {
        return !hasVoted[_voter] && !votingEnded && block.timestamp < votingEndTime;
    }
}

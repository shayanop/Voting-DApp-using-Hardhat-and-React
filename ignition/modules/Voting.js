const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingModule", (m) => {
  // Voting duration: 7 days (7 * 24 * 60 * 60 = 604800 seconds)
  const votingDuration = m.getParameter("votingDuration", 604800);
  
  const voting = m.contract("Voting_ShayanAhmed", [votingDuration]);

  return { voting };
});

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Voting = await hre.ethers.getContractFactory("Voting_ShayanAhmed");
  const durationSecs = 7 * 24 * 60 * 60; // 7 days
  const voting = await Voting.deploy(durationSecs);
  await voting.waitForDeployment();
  console.log("Voting_ShayanAhmed deployed to:", await voting.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});




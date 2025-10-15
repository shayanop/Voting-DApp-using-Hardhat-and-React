const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Voting_YourName", function () {
  let voting;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let votingDuration = 3600; // 1 hour for testing

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const Voting = await ethers.getContractFactory("Voting_YourName");
    voting = await Voting.deploy(votingDuration);
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await voting.admin()).to.equal(owner.address);
    });

    it("Should set the correct voting end time", async function () {
      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const expectedEndTime = block.timestamp + votingDuration;
      const actualEndTime = await voting.votingEndTime();
      
      // Allow for small time difference
      expect(actualEndTime).to.be.closeTo(expectedEndTime, 5);
    });

    it("Should initialize with zero candidates and votes", async function () {
      expect(await voting.candidatesCount()).to.equal(0);
      expect(await voting.totalVotes()).to.equal(0);
      expect(await voting.votingEnded()).to.equal(false);
    });
  });

  describe("Adding Candidates", function () {
    it("Should allow admin to add candidates", async function () {
      await expect(voting.connect(owner).addCandidate("Alice"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(1, "Alice");
      
      expect(await voting.candidatesCount()).to.equal(1);
      const candidate = await voting.getCandidate(1);
      expect(candidate.name).to.equal("Alice");
      expect(candidate.voteCount).to.equal(0);
    });

    it("Should not allow non-admin to add candidates", async function () {
      await expect(voting.connect(addr1).addCandidate("Bob"))
        .to.be.revertedWith("Only admin can perform this action");
    });

    it("Should not allow adding candidates after voting ends", async function () {
      // End voting
      await voting.connect(owner).endVoting();
      
      await expect(voting.connect(owner).addCandidate("Charlie"))
        .to.be.revertedWith("Voting has ended");
    });

    it("Should not allow adding empty candidate name", async function () {
      await expect(voting.connect(owner).addCandidate(""))
        .to.be.revertedWith("Candidate name cannot be empty");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await voting.connect(owner).addCandidate("Alice");
      await voting.connect(owner).addCandidate("Bob");
    });

    it("Should allow users to vote", async function () {
      const tx = await voting.connect(addr1).vote(1);
      await expect(tx)
        .to.emit(voting, "VoteCast")
        .withArgs(addr1.address, 1, anyValue);
      
      expect(await voting.hasVoted(addr1.address)).to.equal(true);
      expect(await voting.getVotesForCandidate(1)).to.equal(1);
      expect(await voting.totalVotes()).to.equal(1);
    });

    it("Should not allow voting twice", async function () {
      await voting.connect(addr1).vote(1);
      
      await expect(voting.connect(addr1).vote(2))
        .to.be.revertedWith("You have already voted");
    });

    it("Should not allow voting for invalid candidate", async function () {
      await expect(voting.connect(addr1).vote(0))
        .to.be.revertedWith("Invalid candidate ID");
      
      await expect(voting.connect(addr1).vote(3))
        .to.be.revertedWith("Invalid candidate ID");
    });

    it("Should not allow voting after voting ends", async function () {
      await voting.connect(owner).endVoting();
      
      await expect(voting.connect(addr1).vote(1))
        .to.be.revertedWith("Voting has ended");
    });

    it("Should track votes correctly", async function () {
      await voting.connect(addr1).vote(1);
      await voting.connect(addr2).vote(1);
      await voting.connect(addr3).vote(2);
      
      expect(await voting.getVotesForCandidate(1)).to.equal(2);
      expect(await voting.getVotesForCandidate(2)).to.equal(1);
      expect(await voting.totalVotes()).to.equal(3);
    });
  });

  describe("Ending Voting", function () {
    beforeEach(async function () {
      await voting.connect(owner).addCandidate("Alice");
      await voting.connect(owner).addCandidate("Bob");
    });

    it("Should allow admin to end voting early", async function () {
      await expect(voting.connect(owner).endVoting())
        .to.emit(voting, "VotingEnded");
      
      expect(await voting.votingEnded()).to.equal(true);
    });

    it("Should not allow non-admin to end voting", async function () {
      await expect(voting.connect(addr1).endVoting())
        .to.be.revertedWith("Only admin can perform this action");
    });

    it("Should not allow ending voting twice", async function () {
      await voting.connect(owner).endVoting();
      
      await expect(voting.connect(owner).endVoting())
        .to.be.revertedWith("Voting has already ended");
    });
  });

  describe("Getting Results", function () {
    beforeEach(async function () {
      await voting.connect(owner).addCandidate("Alice");
      await voting.connect(owner).addCandidate("Bob");
      await voting.connect(owner).addCandidate("Charlie");
    });

    it("Should return correct winner", async function () {
      await voting.connect(addr1).vote(1);
      await voting.connect(addr2).vote(1);
      await voting.connect(addr3).vote(2);
      
      await voting.connect(owner).endVoting();
      
      expect(await voting.getWinner()).to.equal(1);
      expect(await voting.getWinnerName()).to.equal("Alice");
    });

    it("Should handle tie correctly", async function () {
      await voting.connect(addr1).vote(1);
      await voting.connect(addr2).vote(2);
      
      await voting.connect(owner).endVoting();
      
      // In case of tie, it should return the first candidate with max votes
      expect(await voting.getWinner()).to.equal(1);
    });

    it("Should return 0 when no votes cast", async function () {
      await voting.connect(owner).endVoting();
      
      expect(await voting.getWinner()).to.equal(0);
      expect(await voting.getWinnerName()).to.equal("No votes cast");
    });

    it("Should not allow getting winner while voting is active", async function () {
      await expect(voting.getWinner())
        .to.be.revertedWith("Voting is still active");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      await voting.connect(owner).addCandidate("Alice");
    });

    it("Should return correct voting status", async function () {
      const [ended, currentTime, endTime] = await voting.getVotingStatus();
      expect(ended).to.equal(false);
      expect(currentTime).to.be.closeTo(await time.latest(), 5);
      expect(endTime).to.be.gt(currentTime);
    });

    it("Should return correct remaining time", async function () {
      const remainingTime = await voting.getRemainingTime();
      expect(remainingTime).to.be.gt(0);
      expect(remainingTime).to.be.lte(votingDuration);
    });

    it("Should return 0 remaining time after voting ends", async function () {
      await voting.connect(owner).endVoting();
      expect(await voting.getRemainingTime()).to.equal(0);
    });

    it("Should check if user can vote correctly", async function () {
      expect(await voting.canVote(addr1.address)).to.equal(true);
      
      await voting.connect(addr1).vote(1);
      expect(await voting.canVote(addr1.address)).to.equal(false);
    });

    it("Should return all candidates", async function () {
      await voting.connect(owner).addCandidate("Bob");
      
      const candidates = await voting.getAllCandidates();
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[1].name).to.equal("Bob");
    });
  });

  describe("Time-based Voting End", function () {
    it("Should automatically end voting after duration", async function () {
      await voting.connect(owner).addCandidate("Alice");
      
      // Fast forward time
      await time.increase(votingDuration + 1);
      
      await expect(voting.connect(addr1).vote(1))
        .to.be.revertedWith("Voting has ended");
      
      expect(await voting.getRemainingTime()).to.equal(0);
    });
  });
});

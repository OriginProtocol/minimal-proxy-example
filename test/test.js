const { expect } = require("chai");
const { formatBytes32String, getAddress } = require('ethers').utils

const salts = [formatBytes32String('1'), formatBytes32String('2')]

let pairMaster
let pairFactory

const DAI_ADDRESS = getAddress('0x6b175474e89094c44da98b954eedeac495271d0f');
const WETH_ADDRESS = getAddress('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
const OGN_ADDRESS = getAddress('0x8207c1ffc5b6804f6024322ccf34f29c3541ae26');


describe("Minimal Proxy | EIP-1167", function () {

  it("Should deploy master Pair contract", async function () {
    pairMaster = await (await ethers.getContractFactory("Pair")).deploy();
    expect(pairMaster.address).to.exist;
  });

  it("Should deploy PairFactory contract", async function () {
    pairFactory = await (await ethers.getContractFactory("PairFactory")).deploy(pairMaster.address);
    expect(pairFactory.address).to.exist;
  });

  it("Should deploy a cloned Pair contract and allow initialization of custom pair info", async function () {

    const [owner, addr1, addr2] = await ethers.getSigners();

    // Get the expected address
    const pairAddress = await pairFactory.getPairAddress(salts[0]);
    expect(pairAddress).to.exist;

    const tx = await pairFactory.createPair(salts[0]);
    await tx.wait()

    const pair1 = new ethers.Contract(
      pairAddress,
      [
        'function initialize(address _tokenA, address _tokenB) public',
        'function getPair() external view returns (address[] memory)',
      ],
      addr1
    );
    expect(pair1.address).to.equal(pairAddress)



    let initTx = await pair1.initialize(WETH_ADDRESS, OGN_ADDRESS);
    await initTx.wait()

    await expect(pair1.initialize(WETH_ADDRESS, OGN_ADDRESS)).to.be.revertedWith(
      "contract is already initialized"
    )

    let tokens = await pair1.getPair()
    expect(tokens[0]).to.equal(WETH_ADDRESS)
    expect(tokens[1]).to.equal(OGN_ADDRESS)

  });
});
# Minimal Proxy | EIP-1167

> This README is based on an article posted on the Origin Protocol Medium entitled - `A Minimal Proxy in the Wild`

The recent network load on Ethereum has caused teams both large and small to rethink and optimize their solidity and contract deployment architecture. The team at Origin Protocol is no exception and has been working to optimize our existing codebase for both efficiency and cost in our OUSD and Launchpad products. One recent example is the usage of Minimal Proxy(s) in the deposit interface of our Launchpad product.

Minimal Proxy Contract
======================

When most blockchain developers hear the term, proxy, they immediately think of a design pattern for upgradeability. ie. The end user interacts with ProxyOrigin which proxies its calls to ContractOriginAlpha. This allows the Origin developers to swap out ContractOriginAlpha with ContractOriginBeta by simply updating an address in ProxyOrigin.

The above pattern IS NOT what is implied by a Minimal Proxy contract. A Minimal Proxy is typically used when your project needs to deploy multiple large contracts whose code is more or less the same but require different initialization. The Minimal Proxy implementation allows you to deploy an extremely small standalone contract that inherits all of the logic of a larger deployed contract. The introduction of [EIP 1167](https://eips.ethereum.org/EIPS/eip-1167) and the integration of the standard into [OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones) has enabled developers to take advantage of this powerful tool.

Probably the most frequently used implementation of [EIP 1167](https://eips.ethereum.org/EIPS/eip-1167) is by Uniswap V1 in the creation of their AMM pools. There is a single AMM contract that manages the distribution of two assets, but the magic happens when a new pool is created. Uniswap V1 creates a Minimal Proxy to the underlying AMM contract whenever a new pair is added. We can observe this onchain by looking at the underlying code for an AMM pool address such as the [SAI/WETH pool](https://etherscan.io/address/0x09cabec1ead1c0ba254b09efb3ee13841712be14#code). If you notice the code of the contract, there is a small bytecode string:

```
0x3660006000376110006000366000732157a7894439191e520825fe9399ab8655e0f7085af41558576110006000f3
```

Pretty cool, huh?

The Minimal Proxy implementation allows you to deploy an extremely small standalone contract that inherits all of the logic of a larger deployed contract.

In Origin’s case, we had a decent-sized contract for receiving user deposits, but we didn’t want to deploy that contract for each user that deposited on our platform. The correct usage of a Minimal Proxy can result in substantial reduction in deployment costs and less on-chain contract maintenance.

A Simple Example
================

The Origin implementation is beyond the scope of this article, but we have cooked up a simple example to get you on the path to minimalism.

Our example project will be a simple dummy AMM that uses a factory contract to create pair contracts via the Minimal Proxy pattern.

> Spoiler alert -it’s cheaper. A LOT cheaper…

**Setup**

```
\# Clone example project  
\> git clone [git@github.com](mailto:git@github.com):cipherzzz/minimal-proxy-example.git\# Install dependencies  
\> cd minimal-proxy-example && yarn\# Verify  
\> npx hardhat test
```

The tests should pass and output something like this

```
Minimal Proxy | EIP-1167  
    ✓ Should deploy master Pair contract (654ms)  
    ✓ Should deploy PairFactory contract (65ms)  
    ✓ Should deploy a cloned Pair contract and allow initialization of custom pair info (212ms)  
    ✓ Minimal Proxy deployment should cost less than a standard deployment4 passing (937ms)
```

**Digging Deeper**

Our example application really consists of two contracts, the `PairFactory` and `Pair` . In a decentralized AMM, anyone should be able to create a token pair to trade with if it does not already exist. That is the primary purpose of the `PairFactory` — to enable the creation of a `Pair` instance. The `Pair` contract in our application can be thought of as a deployed library or placeholder for our many pairs that we want to deploy. Let’s walk through the test to understand further.

**test.js**

In the above test, we deploy the `PairFactory` and `Pair` contract on lines 23 and 29. Now that these are deployed, we are in a good place to begin a deploy of our Minimal Proxy clone.

**Deploying the Minimal Proxy**

Notice on line 38 of the test, that we get the expected address of the deployed contract using the `PairFactory.getPairAddress` method and a salt. The [OpenZeppelin Clone](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones) library enables us to get the expected address in a deterministic fashion. We can also, deploy the minimal proxy pair contract using the same salt as seen in line 41. Note that the deployed address and pre-fetched address are the same in line 53.

**PairFactory.sol**

The underlying magic methods that provide the deterministic address fetch and clone are made possible by the import on line 3

```
import "@openzeppelin/contracts/proxy/Clones.sol";
```

Line 15 essentially decorates the `address` object with the functions available in the `Clones.sol` enabling the `predictDeterministicAddress` and `cloneDeterministic` functions that we use on lines 23 and 27 respectively.

**Pair.sol**

The `Pair.sol` contract is the `master` contract that all of the Minimal Proxies will derive functionality from. Note that once the proxy has been deployed, it may be initialized and maintain its own storage separate from that of the `master` contract. This allows the `PairFactory` to cheaply deploy a large number of `Pair` instances.

$$$
===

Congratulations on making it this far. By now, you should have a good grasp on how to use the Minimal Proxy pattern in your applications to manage cost and maintenance of your dApps. Did you happen to spot the assertion in `test.js` where we compared the cost of a typical deploy of the `Pair` contract vs. a Minimal Proxy deploy? It’s below and on line 70 of the test file.

```
expect(Number(pairStandaloneGas)).to.be.greaterThan(Number(pairProxyGas)\*10)
```

You read it right, the Minimal Proxy pattern is **10x** more gas efficient than a typical contract deploy.

Conclusion
==========

The Minimal Proxy is a great pattern to add to your toolkit as a blockchain developer and can have really great payoffs when applied correctly. The team at Origin Protocol is committed to providing the most secure, performant, and cost-effective products in the space. Community is a big part of the ethos at Origin and we love contributions from our open-source community. Here are a couple suggestions for where to start.

*   [Origin-Dollar](https://github.com/OriginProtocol/origin-dollar/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

> PS. We actually hire out of our community contributors as well, so if you’re interested working at Origin send a PR our way!

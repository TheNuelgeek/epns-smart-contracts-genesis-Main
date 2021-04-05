const deploy = {
  network: {
    mainnet: {
      version: 1
    },
    goerli: {
      version: 1
    },
    kovan: {
      version: 1
    },
    ropsten: {
      version: 1
    },
    rinkeby: {
      version: 1
    },
    hardhat: {
      version: 1
    },
    localhost: {
      version: 1
    }
  },
  args: {
    pushTokenAddress: '0x0fe4223AD99dF788A6Dcad148eB4086E6389cEB6',
    commUnlockedContract: '0x3fdc08D815cc4ED3B7F69Ee246716f2C8bCD6b07',
    polkaWalletAddress: '0x52542B1Fc37E6AAe19ab23881fAb71E818389ADF',
    amountETHForPolka: 7.5,
  }
}

exports.deploy = deploy

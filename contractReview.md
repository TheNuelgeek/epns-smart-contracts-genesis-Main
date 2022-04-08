#  **EPNS CONTRACT REVIEW (EPNSBenchmarkV3.sol)**

#### *Company: Ethereum Push Notification Service*
#### *Source Code: https://github.com/TheNuelgeek/epns-smart-contracts-genesis/blob/master/contracts/benchmarks/EPNSBenchmarkV3.sol*

#### Reviewed by: [Nuelgeek](https://github.com/TheNuelgeek)
---
#  **Review**
The `EPNSBenchmarkV3.sol` is an ERC20 contract which implements the specification of ERC20 token standard and more as stated below
##  **State Variables**

```
    string public constant name = "Ethereum Push Notification Service";

    string public constant symbol = "PUSH";

    uint8 public constant decimals = 18;

    uint public totalSupply = 100_000_000e18; // 100 million PUSH

    uint public born;

       /// @dev Allowance amounts on behalf of others
    mapping (address => mapping (address => uint96)) internal allowances;

    /// @dev Official record of token balances for each account
    mapping (address => uint96) internal balances;

    /// @notice Official record of the token block information for the holder
    mapping (address => uint) public holderWeight;

    /// @notice A record of each accounts delegate
    mapping (address => address) public delegates;

    /// @notice A checkpoint for marking number of votes from a given block
    struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
    }

    /// @notice A record of votes checkpoints for each account, by index
    mapping (address => mapping (uint32 => Checkpoint)) public checkpoints;

    /// @notice The number of checkpoints for each account
    mapping (address => uint32) public numCheckpoints;

    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

    /// @notice The EIP-712 typehash for the delegation struct used by the contract
    bytes32 public constant DELEGATION_TYPEHASH = keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    /// @notice The EIP-712 typehash for the permit struct used by the contract
    bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    /// @notice A record of states for signing / validating signatures
    mapping (address => uint) public nonces;

    /// @notice An event thats emitted when an account changes its delegate
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    /// @notice An event thats emitted when a delegate account's vote balance changes
    event DelegateVotesChanged(address indexed delegate, uint previousBalance, uint newBalance);

    /// @notice The standard EIP-20 transfer event
    event Transfer(address indexed from, address indexed to, uint256 amount);

    /// @notice The standard EIP-20 approval event
    event Approval(address indexed owner, address indexed spender, uint256 amount);
```
##  **Functions**
The Constructor, constructs a new PUSH TOKEN and allows the initial account to grant all the tokens into existence
```
    constructor(address account) public {
        balances[account] = uint96(totalSupply);
        emit Transfer(address(0), account, totalSupply);

        // holder weight initial adjustments
        holderWeight[account] = block.number;
        born = block.number;
    }
```
@allowance() Get the number of tokens `spender` is approved to spend on behalf of `account`
```
    function allowance(address account, address spender) external view returns (uint) {
        return allowances[account][spender];
    }

```
@approve() first set the allowance to 0 before setting it to another value for the same `spender` then Approve `spender` to transfer up to `amount` from `src` and emits Approvals.

@safe96 An internal call was made to safe96 which checks if a value is greater than 96 bits and returns an error message
```
    function approve(address spender, uint rawAmount) external returns (bool) {
        uint96 amount;
        if (rawAmount == uint(-1)) {
            amount = uint96(-1);
        } else {
            amount = safe96(rawAmount, "Push::approve: amount exceeds 96 bits");
        }

        allowances[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }
```
```
   function safe96(uint n, string memory errorMessage) internal pure returns (uint96) {
        require(n < 2**96, errorMessage);
        return uint96(n);
    }return true;
    }
```
@permit Triggers an approval from owner to spends | Approve by an offchain signature using the [Eip712](https://eips.ethereum.org/EIPS/eip-712) Standard
```
  function permit(address owner, address spender, uint rawAmount, uint deadline, uint8 v, bytes32 r, bytes32 s) external {
        uint96 amount;
        if (rawAmount == uint(-1)) {
            amount = uint96(-1);
        } else {
            amount = safe96(rawAmount, "Push::permit: amount exceeds 96 bits");
        }

        bytes32 domainSeparator = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), getChainId(), address(this)));
        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, rawAmount, nonces[owner]++, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ecrecover(digest, v, r, s);

        require(signatory != address(0), "Push::permit: invalid signature");
        require(signatory == owner, "Push::permit: unauthorized");
        require(now <= deadline, "Push::permit: signature expired");

        allowances[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }
```
@balanceOf Accepts and address and Get the number of tokens held by the `account`
```
  function balanceOf(address account) external view returns (uint) {
        return balances[account];
    }
```
@transfer Transfer `amount` tokens from `msg.sender` to `dst`
```
   function transfer(address dst, uint rawAmount) external returns (bool) {
        uint96 amount = safe96(rawAmount, "Push::transfer: amount exceeds 96 bits");
        _transferTokens(msg.sender, dst, amount);
        return true;
    }
```
@transferFrom accepts A sender, destionation and amount then Transfer `amount` tokens from `src` to `dst` if it is there first allowance, else it increases the previous allowance
```
   function transferFrom(address src, address dst, uint rawAmount) external returns (bool) {
        address spender = msg.sender;
        uint96 spenderAllowance = allowances[src][spender];
        uint96 amount = safe96(rawAmount, "Push::approve: amount exceeds 96 bits");

        if (spender != src && spenderAllowance != uint96(-1)) {
            uint96 newAllowance = sub96(spenderAllowance, amount, "Push::transferFrom: transfer amount exceeds spender allowance");
            allowances[src][spender] = newAllowance;

            emit Approval(src, spender, newAllowance);
        }

        _transferTokens(src, dst, amount);
        return true;
    }
```
@resetHolderWeight() Reset holder weight to current block
```
   function resetHolderWeight() external {
      holderWeight[msg.sender] = block.number;
    }
```
@burn Destory `RawAmount` of tokens from a holder `account`, by sending it to address Zero where it can't be accessed.
```
   function burn(uint256 rawAmount) external {
        address account = msg.sender;
        require(account != address(0), "Push::burn: cant be done the zero address");

        uint96 balance = balances[account];
        uint96 amount = safe96(rawAmount, "Push::burn: amount exceeds 96 bits");

        balances[account] = sub96(balance, amount, "Push::burn: burn amount exceeds balance");
        totalSupply = sub256(totalSupply, rawAmount, "Push::burn: supply underflow");
        emit Transfer(account, address(0), amount);
    }

```
@delegate Delegate votes from `msg.sender` to `delegatee`
```
   function delegate(address delegatee) public {
        return _delegate(msg.sender, delegatee);
    }

```
@delegateBySig  Delegates votes from signatory to `delegatee` using the [Eip712](https://eips.ethereum.org/EIPS/eip-712) (offchain message signing) Standard and 
```
   function delegateBySig(address delegatee, uint nonce, uint expiry, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 domainSeparator = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), getChainId(), address(this)));
        bytes32 structHash = keccak256(abi.encode(DELEGATION_TYPEHASH, delegatee, nonce, expiry));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "Push::delegateBySig: invalid signature");
        require(nonce == nonces[signatory]++, "Push::delegateBySig: invalid nonce");
        require(now <= expiry, "Push::delegateBySig: signature expired");
        return _delegate(signatory, delegatee);
    }
```
@getCurrentVotes Gets the current votes balance for `account`
```
   function getCurrentVotes(address account) external view returns (uint96) {
        uint32 nCheckpoints = numCheckpoints[account];
        return nCheckpoints > 0 ? checkpoints[account][nCheckpoints - 1].votes : 0;
    }
```
@getPriorVotes takes in an address and blockNumber. Determine the prior number of votes for an account as of a block number and Block number must be a finalized block or else this function will revert to prevent misinformation.
```
   function getPriorVotes(address account, uint blockNumber) public view returns (uint96) {
        require(blockNumber < block.number, "Push::getPriorVotes: not yet determined");

        uint32 nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[account][nCheckpoints - 1].votes;
        }

        // Next check implicit zero balance
        if (checkpoints[account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.votes;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[account][lower].votes;
    }
```
@_delagate This function takes in 2 in parameters adresses of  `delegatoe` and `delegator` then changes the delegator to a new delegator address 
```
   function _delegate(address delegator, address delegatee) internal {
        address currentDelegate = delegates[delegator];
        uint96 delegatorBalance = balances[delegator];
        delegates[delegator] = delegatee;

        emit DelegateChanged(delegator, currentDelegate, delegatee);

        _moveDelegates(currentDelegate, delegatee, delegatorBalance);
    }
```
@_transferTokens This function transfers amount from `src` to `dst` and confirms that both are not address `0`, updates balance
```
   function _transferTokens(address src, address dst, uint96 amount) internal {
        require(src != address(0), "Push::_transferTokens: cannot transfer from the zero address");
        require(dst != address(0), "Push::_transferTokens: cannot transfer to the zero address");

        // adjust holder weight
        _adjustHolderWeight(src, dst, amount);

        // update balance
        balances[src] = sub96(balances[src], amount, "Push::_transferTokens: transfer amount exceeds balance");
        balances[dst] = add96(balances[dst], amount, "Push::_transferTokens: transfer amount overflows");
        emit Transfer(src, dst, amount);

        _moveDelegates(delegates[src], delegates[dst], amount);
    }

```
@_adjustHolderWeight
```
   function _adjustHolderWeight(address src, address dst, uint96 amount) internal {
      // change holderWeight block
      if (balances[dst] == 0) {
        holderWeight[dst] = holderWeight[src];
      }
      else {
        uint256 dstWeight = mul256(holderWeight[dst], balances[dst], "Push::_transferTokens: holder dst weight exceeded limit");
        uint256 srcWeight = mul256(holderWeight[src], amount, "Push::_transferTokens: holder src weight exceeded limit");

        uint256 totalWeight = add256(dstWeight, srcWeight, "Push::_transferTokens: total weight exceeded limit");
        uint256 totalAmount = add256(balances[dst], amount, "Push::_transferTokens: total amount exceeded limit");

        holderWeight[dst] = div256(totalWeight, totalAmount, "Push::_transferTokens: holderWeight averaged exceeded limit");
      }
    }

```
@safe32 This requires that the input is lesser than 32 Bits
```
   function safe32(uint n, string memory errorMessage) internal pure returns (uint32) {
        require(n < 2**32, errorMessage);
        return uint32(n);
    }

```
@safe96 This requires that the input is lesser than 96Bits
```
   function safe96(uint n, string memory errorMessage) internal pure returns (uint96) {
        require(n < 2**96, errorMessage);
        return uint96(n);
    }

```
@add96 This adds the inputs and checks for underflow/overflow, then returns the value in variable container of 96bits

@sub96 The function subtracts the inputs and returns the difference while checking  for overflow/unuderflow

@add256 This adds the inputs and checks for underflow/overflow returns the value in variable container of 256bits

@sub256 This subtracts the inputs and checks for underflow/overflow, then returns the value in variable container of 256bits

@mul256 Multiplies the inputs and optimizes the using [Open Zepplin multication multipler](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522)

@div256 Divides the inputs 

@getChainId Returns the chain ID of the current connected node as described in the EIP-695.
```
    function add96(uint96 a, uint96 b, string memory errorMessage) internal pure returns (uint96) {
        uint96 c = a + b;
        require(c >= a, errorMessage);
        return c;
    }

    function sub96(uint96 a, uint96 b, string memory errorMessage) internal pure returns (uint96) {
        require(b <= a, errorMessage);
        return a - b;
    }

    function add256(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, errorMessage);

        return c;
    }

    function sub256(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    function mul256(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, errorMessage);

        return c;
    }

    function div256(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
      // Solidity only automatically asserts when dividing by 0
      require(b > 0, errorMessage);
      uint256 c = a / b;
      // assert(a == b * c + a % b); // There is no case in which this doesn't hold

      return c;
    }

    function getChainId() internal pure returns (uint) {
        uint256 chainId;
        assembly { chainId := chainid() }
        return chainId;
    }

```
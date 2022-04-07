#  **EPNS CONTRACT REVIEW (EPNSBenchmarkV3.sol)**

#### *Company: Ethereum Push Notification Service*
#### *Source Code: https://github.com/TheNuelgeek/epns-smart-contracts-genesis/blob/master/contracts/benchmarks/EPNSBenchmarkV3.sol*

---
#  **Review**

##  **State Variables**

```
    string public constant name = "Ethereum Push Notification Service";

    string public constant symbol = "PUSH";

    uint8 public constant decimals = 18;

    uint public totalSupply = 100_000_000e18; // 100 million PUSH

    uint public born;
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
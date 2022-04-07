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
@approve() set the allowance first to 0 before setting it to another value for the same `spender` then Approve `spender` to transfer up to `amount` from `src` and emits Approvals.

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

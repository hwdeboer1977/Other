import os
import sys
import json
import logging
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

# Configuration
RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
TEST_USER = os.getenv("USER")

# Web3 and contract setup
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = Account.from_key(PRIVATE_KEY)

# Load contract ABI
with open("src/abis/abi.json", "r") as f:
    abi = json.load(f)

contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)

# Helper: decode bytes32 strings
def decode_bytes32(b):
    return Web3.to_text(b).rstrip("\x00")

# Helper: sign and send transaction
def send_transaction(tx_func):
    nonce = w3.eth.get_transaction_count(account.address)
    tx = tx_func.build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gas": 300000,
        "gasPrice": w3.eth.gas_price,
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    logger.info("✅ Transaction sent: %s", tx_hash.hex())
    return receipt

# Command: Create intent
def create_intent():
    user = Web3.to_checksum_address(TEST_USER)
    intent = contract.functions.getIntent(user).call()

    if intent[6] == 1:
        logger.warning("User already has an active intent.")
        return

    platform = 0  # Hyperliquid
    coin = Web3.to_bytes(text="ETH").ljust(32, b"\x00")
    side = 1  # Short
    size = w3.to_wei(0.003, "ether")
    min_price = w3.to_wei(2500, "ether")

    send_transaction(contract.functions.createIntent(platform, coin, side, size, min_price))

# Command: Update intent
def update_intent():
    user = Web3.to_checksum_address(TEST_USER)
    intent = contract.functions.getIntent(user).call()

    if intent[6] != 1:
        logger.warning("No active intent to update.")
        return

    platform = 0
    coin = Web3.to_bytes(text="ETH").ljust(32, b"\x00")
    side = 1
    size = w3.to_wei(0.004, "ether")
    min_price = w3.to_wei(2500, "ether")

    send_transaction(contract.functions.createIntent(platform, coin, side, size, min_price))

# Command: Delete intent
def delete_intent():
    user = Web3.to_checksum_address(TEST_USER)
    intent = contract.functions.getIntent(user).call()

    if intent[6] != 1:
        logger.warning("No active intent to delete.")
        return

    send_transaction(contract.functions.clearIntent())

# Command: Check current intent
def check_intent():
    user = Web3.to_checksum_address(TEST_USER)
    intent = contract.functions.getIntent(user).call()

    logger.info("🧾 Current Intent:")
    logger.info("Protocol: %s", ["Hyperliquid", "Drift", "Unknown"][intent[0]])
    logger.info("Coin: %s", decode_bytes32(intent[1]))
    logger.info("Side: %s", "Long" if intent[2] == 0 else "Short")
    logger.info("Size: %s", Web3.from_wei(intent[3], "ether"))
    logger.info("Min Price: %s", Web3.from_wei(intent[4], "ether"))
    logger.info("Status: %s", ["None", "Active", "Cancelled"][intent[6]])


# CLI dispatcher
if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.info("Usage: python createIntent.py [create|update|delete|check]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    actions = {
        "create": create_intent,
        "update": update_intent,
        "delete": delete_intent,
        "check": check_intent,
    }

    if cmd in actions:
        actions[cmd]()
    else:
        logger.error("❌ Unknown command: %s", cmd)
        logger.info("Available commands: create, update, delete, check")

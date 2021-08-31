// SPDX-License-Identifier: MIT
pragma solidity 0.8.5;
pragma abicoder v2;

import {InitializedProxy} from "./InitializedProxy.sol";
import {PartyRarible, IExchangeV2} from "./PartyRarible.sol";

contract PartyRaribleFactory {
    //======== Events ========

    event PartyRaribleDeployed(
        address proxy,
        address creator,
        address _exchange,
        address _nftOwner,
        address _nftContract,
        uint256 _tokenId,
        IExchangeV2.AssetType _ethAssetType,
        IExchangeV2.AssetType _nftAssetType,
        string _name,
        string _symbol
    );

    //======== Immutable storage =========

    address public immutable logic;
    address public immutable partyDAOMultisig;
    address public immutable tokenVaultFactory;
    address public immutable weth;

    //======== Mutable storage =========

    // PartyBid proxy => block number deployed at
    mapping(address => uint256) public deployedAt;

    uint256 public totalProxies;
    mapping(uint256 => address) public proxies;

    //======== Constructor =========

    constructor(
        address _partyDAOMultisig,
        address _tokenVaultFactory,
        address _weth,
        address _logicExchange,
        address _logicNftOwner,
        address _logicNftContract,
        uint256 _logicTokenId,
        IExchangeV2.AssetType memory _logicEthAssetType,
        IExchangeV2.AssetType memory _logicNftAssetType
    ) {
        partyDAOMultisig = _partyDAOMultisig;
        tokenVaultFactory = _tokenVaultFactory;
        weth = _weth;
        // deploy logic contract
        PartyRarible _logicContract = new PartyRarible(
            _partyDAOMultisig,
            _tokenVaultFactory,
            _weth
        );
        // initialize logic contract
        _logicContract.initialize(
            _logicExchange,
            _logicNftOwner,
            _logicNftContract,
            _logicTokenId,
            _logicEthAssetType,
            _logicNftAssetType,
            "PartyRarible",
            "PRBL"
        );
        // store logic contract address
        logic = address(_logicContract);
    }

    //======== Deploy function =========

    function startParty(
        address _exchange,
        address _nftOwner,
        address _nftContract,
        uint256 _tokenId,
        IExchangeV2.AssetType calldata _ethAssetType,
        IExchangeV2.AssetType calldata _nftAssetType,
        string memory _name,
        string memory _symbol
    ) external returns (PartyRarible partyBidProxy) {
        partyBidProxy = new PartyRarible(
            partyDAOMultisig,
            tokenVaultFactory,
            weth
        );

        partyBidProxy.initialize(
            _exchange,
            _nftOwner,
            _nftContract,
            _tokenId,
            _ethAssetType,
            _nftAssetType,
            _name,
            _symbol
        );

        deployedAt[address(partyBidProxy)] = block.number;
        proxies[totalProxies] = address(partyBidProxy);
        totalProxies++;

        emit PartyRaribleDeployed(
            address(partyBidProxy),
            msg.sender,
            _exchange,
            _nftOwner,
            _nftContract,
            _tokenId,
            _ethAssetType,
            _nftAssetType,
            _name,
            _symbol
        );
    }
}

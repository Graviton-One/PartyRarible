pragma solidity 0.8.5;

interface IExchangeV2 {

    struct AssetType {
        bytes4 assetClass;
        bytes data;
    }

    struct Asset {
        AssetType assetType;
        uint value;
    }

    struct Order {
        address maker;
        Asset makeAsset;
        address taker;
        Asset takeAsset;
        uint salt;
        uint start;
        uint end;
        bytes4 dataType;
        bytes data;
    }

    function upsertOrder(Order memory order) external payable;

    function cancel(Order memory order) external;

    function matchOrders(
        Order memory orderLeft,
        bytes memory signatureLeft,
        Order memory orderRight,
        bytes memory signatureRight
    ) external payable;

}

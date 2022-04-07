/**
 * @jest-environment node
 */

import {
  mockingInfuraCommunications,
  withInfuraClient,
} from './provider-test-helpers';

/**
 * Some JSON-RPC endpoints take a "block" param (example: `eth_blockNumber`)
 * which can optionally be left out. Additionally, the endpoint may support some
 * number of arguments, although the "block" param will always be last, even if
 * it is optional. Given this, this function builds a mock `params` array for
 * such an endpoint, filling it with arbitrary values, but with the "block"
 * param missing.
 *
 * @param {number} index - The index within the `params` array where the "block"
 * param *would* appear.
 * @returns {string[]} The mock params.
 */
function buildMockParamsWithoutBlockParamAt(index) {
  const params = [];
  for (let i = 0; i < index; i++) {
    params.push('some value');
  }
  return params;
}

/**
 * Some JSON-RPC endpoints take a "block" param (example: `eth_blockNumber`)
 * which can optionally be left out. Additionally, the endpoint may support some
 * number of arguments, although the "block" param will always be last, even if
 * it is optional. Given this, this function builds a `params` array for such an
 * endpoint with the given "block" param added at the end.
 *
 * @param {number} index - The index within the `params` array to add the
 * "block" param.
 * @param {any} blockParam - The desired "block" param to add.
 * @returns {any[]} The mock params.
 */
function buildMockParamsWithBlockParamAt(index, blockParam) {
  const params = buildMockParamsWithoutBlockParamAt(index);
  params.push(blockParam);
  return params;
}

/**
 * Returns a partial JSON-RPC request object, with the "block" param replaced
 * with the given value.
 *
 * @param {object} request - The request object.
 * @param {string} request.method - The request method.
 * @param {params} [request.params] - The request params.
 * @param {number} blockParamIndex - The index within the `params` array of the
 * block param.
 * @param {any} blockParam - The desired block param value.
 * @returns {object} The updated request object.
 */
function buildRequestWithReplacedBlockParam(
  { method, params = [] },
  blockParamIndex,
  blockParam,
) {
  const updatedParams = params.slice();
  updatedParams[blockParamIndex] = blockParam;
  return { method, params: updatedParams };
}

describe('createInfuraClient', () => {
  // The first time an RPC method is requested, the latest block number is
  // pulled from the block tracker, the RPC method is delegated to Infura, and
  // the result is cached under that block number, as long as the result is
  // "non-empty". The next time the same request takes place, Infura is not hit,
  // and the result is pulled from the cache.
  //
  // For most RPC methods here, a "non-empty" result is a result that is not
  // null, undefined, or a non-standard "nil" value that geth produces.
  //
  // Some RPC methods are cacheable. Consult the definitive list of cacheable
  // RPC methods in `cacheTypeForPayload` within `eth-json-rpc-middleware`.

  describe('when the RPC method is eth_chainId', () => {
    it('does not hit Infura, instead returning the chain id that maps to the Infura network, as a hex string', async () => {
      const chainId = await withInfuraClient(
        { network: 'ropsten' },
        ({ makeRpcCall }) => {
          return makeRpcCall({
            method: 'eth_chainId',
          });
        },
      );

      expect(chainId).toStrictEqual('0x3');
    });
  });

  describe('when the RPC method is net_version', () => {
    it('does not hit Infura, instead returning the chain id that maps to the Infura network, as a decimal string', async () => {
      const chainId = await withInfuraClient(
        { network: 'ropsten' },
        ({ makeRpcCall }) => {
          return makeRpcCall({
            method: 'net_version',
          });
        },
      );

      expect(chainId).toStrictEqual('3');
    });
  });

  // == RPC methods that do not support params
  //
  // For `eth_getTransactionByHash` and `eth_getTransactionReceipt`, a
  // "non-empty" result is not only one that is not null, undefined, or a
  // geth-specific "nil", but additionally a result that has a `blockHash` that
  // is not 0x0.

  describe.each([
    'eth_blockNumber',
    'eth_compileLLL',
    'eth_compileSerpent',
    'eth_compileSolidity',
    'eth_estimateGas',
    'eth_gasPrice',
    'eth_getBlockByHash',
    'eth_getBlockTransactionCountByHash',
    'eth_getBlockTransactionCountByNumber',
    'eth_getCompilers',
    'eth_getFilterLogs',
    'eth_getLogs',
    'eth_getTransactionByBlockHashAndIndex',
    'eth_getTransactionByBlockNumberAndIndex',
    'eth_getUncleByBlockHashAndIndex',
    'eth_getUncleByBlockNumberAndIndex',
    'eth_getUncleCountByBlockHash',
    'eth_getUncleCountByBlockNumber',
    'eth_protocolVersion',
    'shh_version',
    'test_blockCache',
    'test_forkCache',
    'test_permaCache',
    'web3_clientVersion',
    'web3_sha3',
  ])('when the RPC method is %s', (method) => {
    it('does not hit Infura more than once for identical requests', async () => {
      const requests = [{ method }, { method }];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it('hits Infura and does not reuse the result of a previous request if the latest block number was updated since', async () => {
      const requests = [{ method }, { method }];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // Note that we have to mock these requests in a specific order. The
        // first block tracker request occurs because of the first RPC request.
        // The second block tracker request, however, does not occur because of
        // the second RPC request, but rather because we call `clock.runAll()`
        // below.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(async (client) => {
          const firstResult = await client.makeRpcCall(requests[0]);
          // Proceed to the next iteration of the block tracker so that a new
          // block is fetched and the current block is updated
          client.clock.runAll();
          const secondResult = await client.makeRpcCall(requests[1]);
          return [firstResult, secondResult];
        });

        expect(results).toStrictEqual(mockResults);
      });
    });

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [{ method }, { method }];
        const mockResults = [emptyValue, 'some result'];

        await mockingInfuraCommunications(async (comms) => {
          // As with above, the first time a block-cacheable request is made,
          // the latest block number is retrieved through the block tracker
          // first. It doesn't matter what this is — it's just used as a cache
          // key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      },
    );
  });

  describe.each(['eth_getTransactionByHash', 'eth_getTransactionReceipt'])(
    'when the RPC method is %s',
    (method) => {
      it('does not hit Infura more than once for identical requests and it has a valid blockHash', async () => {
        const requests = [{ method }, { method }];
        const mockResults = [{ blockHash: '0x100' }, { blockHash: '0x200' }];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
        });
      });

      it('hits Infura and does not reuse the result of a previous request if the latest block number was updated since', async () => {
        const requests = [{ method }, { method }];
        const mockResults = [{ blockHash: '0x100' }, { blockHash: '0x200' }];

        await mockingInfuraCommunications(async (comms) => {
          // Note that we have to mock these requests in a specific order. The
          // first block tracker request occurs because of the first RPC
          // request. The second block tracker request, however, does not occur
          // because of the second RPC request, but rather because we call
          // `clock.runAll()` below.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(async (client) => {
            const firstResult = await client.makeRpcCall(requests[0]);
            // Proceed to the next iteration of the block tracker so that a new
            // block is fetched and the current block is updated
            client.clock.runAll();
            const secondResult = await client.makeRpcCall(requests[1]);
            return [firstResult, secondResult];
          });

          expect(results).toStrictEqual(mockResults);
        });
      });

      it.each([null, undefined, '\u003cnil\u003e'])(
        'does not reuse the result of a previous request if it was `%s`',
        async (emptyValue) => {
          const requests = [{ method }, { method }];
          const mockResults = [emptyValue, { blockHash: '0x100' }];

          await mockingInfuraCommunications(async (comms) => {
            // As with above, the first time a block-cacheable request is made,
            // the latest block number is retrieved through the block tracker
            // first. It doesn't matter what this is — it's just used as a cache
            // key.
            comms.mockNextBlockTrackerRequest();
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[0],
              response: { result: mockResults[0] },
            });
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[1],
              response: { result: mockResults[1] },
            });

            const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
              makeRpcCallsInSeries(requests),
            );

            expect(results).toStrictEqual(mockResults);
          });
        },
      );

      it('does not reuse the result of a previous request if result.blockHash was null', async () => {
        const requests = [{ method }, { method }];
        const mockResults = [
          { blockHash: null, extra: 'some value' },
          { blockHash: '0x100', extra: 'some other value' },
        ];

        await mockingInfuraCommunications(async (comms) => {
          // As with above, the first time a block-cacheable request is made,
          // the latest block number is retrieved through the block tracker
          // first. It doesn't matter what this is — it's just used as a cache
          // key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      });

      it('does not reuse the result of a previous request if result.blockHash was undefined', async () => {
        const requests = [{ method }, { method }];
        const mockResults = [
          { extra: 'some value' },
          { blockHash: '0x100', extra: 'some other value' },
        ];

        await mockingInfuraCommunications(async (comms) => {
          // As with above, the first time a block-cacheable request is made,
          // the latest block number is retrieved through the block tracker
          // first. It doesn't matter what this is — it's just used as a cache
          // key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      });

      it('does not reuse the result of a previous request if result.blockHash was "0x0000000000000000000000000000000000000000000000000000000000000000"', async () => {
        const requests = [{ method }, { method }];
        const mockResults = [
          {
            blockHash:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            extra: 'some value',
          },
          { blockHash: '0x100', extra: 'some other value' },
        ];

        await mockingInfuraCommunications(async (comms) => {
          // As with above, the first time a block-cacheable request is made,
          // the latest block number is retrieved through the block tracker
          // first. It doesn't matter what this is — it's just used as a cache
          // key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      });
    },
  );

  // == RPC methods that support multiple params (including a "block" param)
  //
  // RPC methods in this category take a non-empty `params` array, and more
  // importantly, one of these items can specify which block the method applies
  // to. This block param may either be a tag ("earliest", "latest", or
  // "pending"), or a specific block number; or this param may not be
  // provided altogether, in which case it defaults to "latest". Also,
  // "earliest" is just a synonym for "0x00".
  //
  // The fact that these methods support arguments affects the caching strategy,
  // because if two requests are made with the same method but with different
  // arguments, then they will be cached separately. Also, the block param
  // changes the caching strategy slightly: if "pending" is specified, then the
  // request is never cached.

  describe.each([
    ['eth_getBlockByNumber', 0],
    ['eth_getBalance', 1],
    ['eth_getCode', 1],
    ['eth_getTransactionCount', 1],
    ['eth_call', 1],
    ['eth_getStorageAt', 2],
  ])('when the RPC method is %s', (method, blockParamIndex) => {
    describe.each([
      ['given no block tag', 'none'],
      ['given a block tag of "latest"', 'latest', 'latest'],
    ])('%s', (_desc, blockParamType, blockParam) => {
      const params =
        blockParamType === 'none'
          ? buildMockParamsWithoutBlockParamAt(blockParamIndex)
          : buildMockParamsWithBlockParamAt(blockParamIndex, blockParam);

      it('does not hit Infura more than once for identical requests', async () => {
        const requests = [
          { method, params },
          { method, params },
        ];
        const mockResults = ['first result', 'second result'];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the block-cache
          // middleware will request the latest block number through the block
          // tracker to determine the cache key. Later, the block-ref
          // middleware will request the latest block number again to resolve
          // the value of "latest", but the block number is cached once made,
          // so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockSuccessfulInfuraRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[0],
              blockParamIndex,
              '0x100',
            ),
            response: { result: mockResults[0] },
          });
          // Oddly, the block-ref middleware will still allow the original
          // request to go through.
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
        });
      });

      it('hits Infura and does not reuse the result of a previous request if the latest block number was updated since', async () => {
        const requests = [
          { method, params },
          { method, params },
        ];
        const mockResults = ['first result', 'second result'];

        await mockingInfuraCommunications(async (comms) => {
          // Note that we have to mock these requests in a specific order.
          // The first block tracker request occurs because of the first RPC
          // request. The second block tracker request, however, does not
          // occur because of the second RPC request, but rather because we
          // call `clock.runAll()` below.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockSuccessfulInfuraRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[0],
              blockParamIndex,
              '0x100',
            ),
            response: { result: mockResults[0] },
          });
          // Oddly, the block-ref middleware will still allow the original
          // request to go through.
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x200' });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });
          // The previous two requests will happen again, with a different block
          // number,in the same order.
          comms.mockSuccessfulInfuraRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[0],
              blockParamIndex,
              '0x200',
            ),
            response: { result: mockResults[1] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(async (client) => {
            const firstResult = await client.makeRpcCall(requests[0]);
            // Proceed to the next iteration of the block tracker so that a
            // new block is fetched and the current block is updated
            client.clock.runAll();
            const secondResult = await client.makeRpcCall(requests[1]);
            return [firstResult, secondResult];
          });

          expect(results).toStrictEqual(mockResults);
        });
      });

      it.each([null, undefined, '\u003cnil\u003e'])(
        'does not reuse the result of a previous request if it was `%s`',
        async (emptyValue) => {
          const requests = [
            { method, params },
            { method, params },
          ];
          const mockResults = [emptyValue, 'some result'];

          await mockingInfuraCommunications(async (comms) => {
            // The first time a block-cacheable request is made, the
            // block-cache middleware will request the latest block number
            // through the block tracker to determine the cache key. Later,
            // the block-ref middleware will request the latest block number
            // again to resolve the value of "latest", but the block number is
            // cached once made, so we only need to mock the request once.
            comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
            // The block-ref middleware will make the request as specified
            // except that the block param is replaced with the latest block
            // number.
            comms.mockSuccessfulInfuraRpcCall({
              request: buildRequestWithReplacedBlockParam(
                requests[0],
                blockParamIndex,
                '0x100',
              ),
              response: { result: mockResults[0] },
            });
            // Oddly, the block-ref middleware will still allow the original
            // request to go through.
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[0],
              response: { result: mockResults[0] },
            });
            // The previous two requests will happen again, in the same order.
            comms.mockSuccessfulInfuraRpcCall({
              request: buildRequestWithReplacedBlockParam(
                requests[0],
                blockParamIndex,
                '0x100',
              ),
              response: { result: mockResults[1] },
            });
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[0],
              response: { result: mockResults[1] },
            });

            const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
              makeRpcCallsInSeries(requests),
            );

            expect(results).toStrictEqual(mockResults);
          });
        },
      );
    });

    describe.each([
      ['given a block tag of "earliest"', 'earliest', 'earliest'],
      ['given a block number', 'block number', '0x100'],
    ])('%s', (_desc, blockParamType, blockParam) => {
      const params = buildMockParamsWithBlockParamAt(
        blockParamIndex,
        blockParam,
      );

      it('does not hit Infura more than once for identical requests', async () => {
        const requests = [
          { method, params },
          { method, params },
        ];
        const mockResults = ['first result', 'second result'];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the block-cache
          // middleware will request the latest block number through the block
          // tracker to determine the cache key. This block number doesn't
          // matter.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
        });
      });

      it('reuses the result of a previous request even if the latest block number was updated since', async () => {
        const requests = [
          { method, params },
          { method, params },
        ];
        const mockResults = ['first result', 'second result'];

        await mockingInfuraCommunications(async (comms) => {
          // Note that we have to mock these requests in a specific order. The
          // first block tracker request occurs because of the first RPC
          // request. The second block tracker request, however, does not
          // occur because of the second RPC request, but rather because we
          // call `clock.runAll()` below.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(async (client) => {
            const firstResult = await client.makeRpcCall(requests[0]);
            // Proceed to the next iteration of the block tracker so that a
            // new block is fetched and the current block is updated
            client.clock.runAll();
            const secondResult = await client.makeRpcCall(requests[1]);
            return [firstResult, secondResult];
          });

          expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
        });
      });

      it.each([null, undefined, '\u003cnil\u003e'])(
        'does not reuse the result of a previous request if it was `%s`',
        async (emptyValue) => {
          const requests = [
            { method, params },
            { method, params },
          ];
          const mockResults = [emptyValue, 'some result'];

          await mockingInfuraCommunications(async (comms) => {
            // As with above, the first time a block-cacheable request is
            // made, the latest block number is retrieved through the block
            // tracker first. It doesn't matter what this is — it's just used
            // as a cache key.
            comms.mockNextBlockTrackerRequest();
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[0],
              response: { result: mockResults[0] },
            });
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[1],
              response: { result: mockResults[1] },
            });

            const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
              makeRpcCallsInSeries(requests),
            );

            expect(results).toStrictEqual(mockResults);
          });
        },
      );

      if (blockParamType === 'earliest') {
        it('treats "0x00" as a synonym for "earliest"', async () => {
          const requests = [
            {
              method,
              params: buildMockParamsWithBlockParamAt(
                blockParamIndex,
                blockParam,
              ),
            },
            {
              method,
              params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x00'),
            },
          ];
          const mockResults = ['first result', 'second result'];

          await mockingInfuraCommunications(async (comms) => {
            // The first time a block-cacheable request is made, the latest
            // block number is retrieved through the block tracker first. It
            // doesn't matter what this is — it's just used as a cache key.
            comms.mockNextBlockTrackerRequest();
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[0],
              response: { result: mockResults[0] },
            });

            const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
              makeRpcCallsInSeries(requests),
            );

            expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
          });
        });
      }

      if (blockParamType === 'block number') {
        it('does not reuse the result of a previous request if it was made with different arguments than this one', async () => {
          await mockingInfuraCommunications(async (comms) => {
            const requests = [
              {
                method,
                params: buildMockParamsWithBlockParamAt(
                  blockParamIndex,
                  '0x100',
                ),
              },
              {
                method,
                params: buildMockParamsWithBlockParamAt(
                  blockParamIndex,
                  '0x200',
                ),
              },
            ];

            // As with above, the first time a block-cacheable request is made,
            // the latest block number is retrieved through the block tracker
            // first. It doesn't matter what this is — it's just used as a cache
            // key.
            comms.mockNextBlockTrackerRequest();
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[0],
              response: { result: 'first result' },
            });
            comms.mockSuccessfulInfuraRpcCall({
              request: requests[1],
              response: { result: 'second result' },
            });

            const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
              makeRpcCallsInSeries(requests),
            );

            expect(results).toStrictEqual(['first result', 'second result']);
          });
        });
      }
    });

    describe('given a block tag of "pending"', () => {
      const params = buildMockParamsWithBlockParamAt(
        blockParamIndex,
        'pending',
      );

      it('hits Infura on all calls and does not cache anything', async () => {
        const requests = [
          { method, params },
          { method, params },
        ];
        const mockResults = ['first result', 'second result'];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the latest
          // block number is retrieved through the block tracker first. It
          // doesn't matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      });
    });
  });
});

const assert = require('assert');
const streamingController = require('./../controllers/streamingController');

describe('Testing streaming services', function() {
  describe('Testing getChunkInfo service', function() {
    const fileSize = 50;
    const correctStart = 0;
    const correctEnd = 10;
    const correctChunkSize = correctEnd - correctStart + 1;
    const correctRange = `bytes=${correctStart}-${correctEnd}`;
    const falseRange1 = 'asdas=0-10';
    const falseRange2 = 'bytes=a-10';
    const falseRange3 = 'bytes=5-b';
    const falseRange4 = 'bytes=5a-6b';
    const falseRange5 = 'bytes=-1-10';
    const falseRange6 = 'bytes=-1-51';
    const falseRange7 = 'byte=10-5';

    it('Shuould throw error if data is invalid', function() {
      assert.throws(() => {
        streamingController.getChunkInfo(falseRange1, fileSize);
      }, `Error is not thrown for invalid input at function getChunkInfo`);
      assert.throws(() => {
        streamingController.getChunkInfo(falseRange2, fileSize);
      }, `Error is not thrown for invalid input at function getChunkInfo`);
      assert.throws(() => {
        streamingController.getChunkInfo(falseRange3, fileSize);
      }, `Error is not thrown for invalid input at function getChunkInfo`);
      assert.throws(() => {
        streamingController.getChunkInfo(falseRange4, fileSize);
      }, `Error is not thrown for invalid input at function getChunkInfo`);
      assert.throws(() => {
        streamingController.getChunkInfo(falseRange5, fileSize);
      }, `Error is not thrown for invalid input at function getChunkInfo`);
      assert.throws(() => {
        streamingController.getChunkInfo(falseRange6, fileSize);
      }, `Error is not thrown for invalid input at function getChunkInfo`);
      assert.throws(() => {
        streamingController.getChunkInfo(falseRange7, fileSize);
      }, `Error is not thrown for invalid input at function getChunkInfo`);
      const chunkData = streamingController.getChunkInfo(
        correctRange,
        fileSize
      );
      assert.ok(
        chunkData.start === correctStart &&
          chunkData.end === correctEnd &&
          chunkData.chunkSize === correctChunkSize,
        `Invalid output from function getChunkInfo`
      );
    });
  });
});

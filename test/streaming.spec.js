const assert = require('assert');
const streamingController = require('./../controllers/streamingController');

describe('Testing streaming services', function() {
  describe('Testing getChunkInfo service', function() {
    const fileSize = 5000000;
    const correctStart1 = 0;
    const correctStart2 = 4900000;
    let correctEnd1 = 10;
    if (correctEnd1 >= fileSize) correctEnd1 = fileSize - 1;
    let correctEnd2 = 16 * 10 ** 5 + correctStart2;
    if (correctEnd2 >= fileSize) correctEnd2 = fileSize - 1;
    const correctChunkSize1 = correctEnd1 - correctStart1 + 1;
    const correctChunkSize2 = correctEnd2 - correctStart2 + 1;
    const correctRange1 = `bytes=${correctStart1}-${correctEnd1}`;
    const correctRange2 = `bytes=${correctStart2}-`;
    const falseRange1 = 'asdas=0-10';
    const falseRange2 = 'bytes=a-10';
    const falseRange3 = 'bytes=5-b';
    const falseRange4 = 'bytes=5a-6b';
    const falseRange5 = 'bytes=-1-10';
    const falseRange6 = 'bytes=-1-51';
    const falseRange7 = 'bytes=10-5';
    const falseRange8 = 'bytes=6000000-7000000';

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
      assert.throws(() => {
        streamingController.getChunkInfo(falseRange8, fileSize);
      }, `Error is not thrown for invalid input at function getChunkInfo`);
      const chunkData1 = streamingController.getChunkInfo(
        correctRange1,
        fileSize
      );
      const chunkData2 = streamingController.getChunkInfo(
        correctRange2,
        fileSize
      );
      assert.ok(
        chunkData1.start === correctStart1 &&
          chunkData1.end === correctEnd1 &&
          chunkData1.chunkSize === correctChunkSize1,
        `Invalid output from function getChunkInfo`
      );
      assert.ok(
        chunkData2.start === correctStart2 &&
          chunkData2.end === correctEnd2 &&
          chunkData2.chunkSize === correctChunkSize2,
        `Invalid output from function getChunkInfo`
      );
    });
  });
});

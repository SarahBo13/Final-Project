const { getWorkMediums } = require("../../../src/mei/extractors/mediumExtractor");

describe("getWorkMediums", () => {

  test("extracts performance mediums from MEI", () => {

    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              perfMedium: {
                perfResList: {
                  perfRes: [
                    {
                      _: "Voice",
                      $: { n: "1", codedval: "vu" }
                    },
                    {
                      _: "Piano",
                      $: { n: "2", codedval: "ka" }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    };

    const result = getWorkMediums(meiJson.mei);

    expect(result.length).toBe(2);

    expect(result[0]).toEqual({
      medium_name: "Voice",
      medium_code: "vu",
      medium_order: 1
    });

    expect(result[1]).toEqual({
      medium_name: "Piano",
      medium_code: "ka",
      medium_order: 2
    });

  });

});

test("returns empty array when no perfMedium exists", () => {

  const meiJson = {
    mei: {
      meiHead: {
        workList: {
          work: {}
        }
      }
    }
  };

  const result = getWorkMediums(meiJson.mei);

  expect(result).toEqual([]);

});
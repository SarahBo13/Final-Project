const { getSources } = require("../../../src/mei/extractors/sourceExtractor");

describe("getSources", () => {
  test("returns [] when no source data exists", () => {
    const meiJson = {
      mei: {
        meiHead: {}
      }
    };

    const result = getSources(meiJson);

    expect(result).toEqual([]);
  });

  test("extracts one old-style source from fileDesc.sourceDesc.source.bibl", () => { 
    const meiJson = { 
      mei: { 
        meiHead: { 
          fileDesc: { 
            sourceDesc: { 
              source: { 
                bibl: { 
                  title: { _: "Manuscript Source" }, 
                  identifier: { 
                    $: { type: "URI" }, 
                    _: "https://example.com" } 
                } 
              } 
            } 
          } 
        } 
      }
    };

    const result = getSources(meiJson.mei);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });

  test("extracts multiple old-style sources", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            sourceDesc: {
              source: [
                { bibl: { title: "Source A" } },
                { bibl: { title: "Source B" } }
              ]
            }
          }
        }
      }
    };

    const result = getSources(meiJson.mei);

    expect(result.length).toBe(2);
  });

  test("skips old-style source entries without bibl", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            sourceDesc: {
              source: [
                { somethingElse: {} },
                { bibl: { title: "Valid Source" } }
              ]
            }
          }
        }
      }
    };

    const result = getSources(meiJson.mei);

    expect(result.length).toBe(1);
  });

  test("extracts one FRBR-style source from manifestationList.manifestation", () => {
    const meiJson = {
      mei: {
        meiHead: {
          manifestationList: {
            manifestation: {
            titleStmt: {
                title: "Printed Edition"
            }
            }
          }
        }
      }
    };

    const result = getSources(meiJson.mei);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });

  test("extracts multiple FRBR-style sources", () => {
    const meiJson = {
      mei: {
        meiHead: {
          manifestationList: {
            manifestation: [
                {
                titleStmt: {
                    title: "Manifestation A"
                }
                },
                {
                titleStmt: {
                    title: "Manifestation B"
                }
                }
            ]
          }
        }
      }
    };

    const result = getSources(meiJson.mei);

    expect(result.length).toBe(2);
  });

  test("joins multiple titles inside one manifestation into notes", () => {
  const meiJson = {
    mei: {
      meiHead: {
        manifestationList: {
          manifestation: {
            titleStmt: {
              title: ["Manifestation A", "Manifestation B"]
            }
          }
        }
      }
    }
  };

    const result = getSources(meiJson.mei);
    expect(result.length).toBe(1);
  });

  test("combines old-style and FRBR-style sources", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            sourceDesc: {
              source: {
                bibl: { title: "Old Style Source" }
              }
            }
          },
          manifestationList: {
            manifestation: {
                titleStmt: {
                 title: "FRBR Source"
                }
            }
          }
        }
      }
    };

    const result = getSources(meiJson.mei);

    expect(result.length).toBe(2);
  });

  test("deduplicates identical sources", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            sourceDesc: {
              source: [
                {
                  bibl: {
                    title: "Duplicate Source"
                  }
                },
                {
                  bibl: {
                    title: "Duplicate Source"
                  }
                }
              ]
            }
          }
        }
      }
    };

    const result = getSources(meiJson.mei);

    expect(result.length).toBe(1);
  });

  test("does not deduplicate distinct sources", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            sourceDesc: {
              source: [
                {
                  bibl: {
                    title: "Source One"
                  }
                },
                {
                  bibl: {
                    title: "Source Two"
                  }
                }
              ]
            }
          }
        }
      }
    };

    const result = getSources(meiJson.mei);

    expect(result.length).toBe(2);
  });
});
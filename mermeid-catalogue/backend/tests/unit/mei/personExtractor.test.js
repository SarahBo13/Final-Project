const { getPersons } = require("../../../src/mei/extractors/personExtractor");

describe("getPersons", () => {
  test("returns [] when no persName entries exist", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              title: "Symphony No. 1"
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([]);
  });

  test("extracts one allowed-role person", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              title: "Test Work",
              composer: {
                persName: {
                  _: "Ludwig van Beethoven",
                  $: { role: "composer", codedval: "12345" }
                }
              }
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([
      {
        name: "Ludwig van Beethoven",
        role: "composer",
        authority_id: "12345"
      }
    ]);
  });

  test("extracts multiple allowed-role persons", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              title: "Test Work",
              composer: {
                persName: {
                  _: "Ludwig van Beethoven",
                  $: { role: "composer", codedval: "beet-1" }
                }
              },
              arranger: {
                persName: {
                  _: "Gustav Mahler",
                  $: { role: "arranger", codedval: "mahl-1" }
                }
              }
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([
      {
        name: "Ludwig van Beethoven",
        role: "composer",
        authority_id: "beet-1"
      },
      {
        name: "Gustav Mahler",
        role: "arranger",
        authority_id: "mahl-1"
      }
    ]);
  });

  test("ignores persons with disallowed roles", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              title: "Test Work",
              respStmt: {
                persName: {
                  _: "Random Assistant",
                  $: { role: "assistant", codedval: "x1" }
                }
              }
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([]);
  });

  test("ignores persons with missing role", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              composer: {
                persName: {
                  _: "Unnamed Role Person",
                  $: { codedval: "x2" }
                }
              }
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([]);
  });

  test("deduplicates identical name-role pairs", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              composer: [
                {
                  persName: {
                    _: "Ludwig van Beethoven",
                    $: { role: "composer", codedval: "a1" }
                  }
                },
                {
                  persName: {
                    _: "Ludwig van Beethoven",
                    $: { role: "composer", codedval: "a1" }
                  }
                }
              ]
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([
      {
        name: "Ludwig van Beethoven",
        role: "composer",
        authority_id: "a1"
      }
    ]);
  });

  test("keeps same person if roles differ", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              composer: {
                persName: {
                  _: "John Smith",
                  $: { role: "composer", codedval: "p1" }
                }
              },
              editor: {
                persName: {
                  _: "John Smith",
                  $: { role: "editor", codedval: "p1" }
                }
              }
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([
      {
        name: "John Smith",
        role: "composer",
        authority_id: "p1"
      },
      {
        name: "John Smith",
        role: "editor",
        authority_id: "p1"
      }
    ]);
  });

  test("trims whitespace in names", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              composer: {
                persName: {
                  _: "  Clara Schumann  ",
                  $: { role: "composer", codedval: "clara-1" }
                }
              }
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([
      {
        name: "Clara Schumann",
        role: "composer",
        authority_id: "clara-1"
      }
    ]);
  });

  test("uses null for missing authority_id", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              librettist: {
                persName: {
                  _: "Hugo von Hofmannsthal",
                  $: { role: "librettist" }
                }
              }
            }
          }
        }
      }
    };

    const result = getPersons(meiJson);

    expect(result).toEqual([
      {
        name: "Hugo von Hofmannsthal",
        role: "librettist",
        authority_id: null
      }
    ]);
  });

  test("returns [] when no work node exists", () => {
    const meiJson = {
      mei: {
        meiHead: {},
        music: {}
      }
    };

    expect(() => getPersons(meiJson)).toThrow();
  });
});
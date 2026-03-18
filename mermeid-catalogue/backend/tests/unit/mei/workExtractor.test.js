const { getWorkData } = require("../../../src/mei/extractors/workExtractor");

describe("getWorkData", () => {
  test("uses file name as mei_id", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: "Symphony No. 5",
            },
          },
          workList: {
            work: {},
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/beethoven_op67.mei");

    expect(result).toEqual({
      mei_id: "beethoven_op67",
      title_main: "Symphony No. 5",
      title_alt: null,
      catalogue_number: null,
      classification: null,
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("uses Untitled work when no titleStmt title exists", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {},
          workList: {
            work: {},
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/work_002.mei");

    expect(result).toEqual({
      mei_id: "work_002",
      title_main: "Untitled work",
      title_alt: null,
      catalogue_number: null,
      classification: null,
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("handles titleStmt title as array and splits main vs alt titles", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: [
                "Main Title",
                "Alternative Title 1",
                "Alternative Title 2",
              ],
            },
          },
          workList: {
            work: {},
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/work_003.mei");

    expect(result).toEqual({
      mei_id: "work_003",
      title_main: "Main Title",
      title_alt: "Alternative Title 1 | Alternative Title 2",
      catalogue_number: null,
      classification: null,
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("extracts title text from xml2js-style title objects", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: [{ _: " Main Title " }, { _: " Alt Title " }],
            },
          },
          workList: {
            work: {},
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/work_004.mei");

    expect(result).toEqual({
      mei_id: "work_004",
      title_main: "Main Title",
      title_alt: "Alt Title",
      catalogue_number: null,
      classification: null,
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("falls back to Untitled work when first title is empty string", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: [""],
            },
          },
          workList: {
            work: {},
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/work_005.mei");

    expect(result.title_main).toBe("Untitled work");
    expect(result.title_alt).toBe(null);
  });

  test("filters empty alternative titles", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: ["Main Title", "", { _: "  " }, "Real Alt Title"],
            },
          },
          workList: {
            work: {},
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/work_006.mei");

    expect(result.title_main).toBe("Main Title");
    expect(result.title_alt).toBe("Real Alt Title");
  });

  test("extracts structured catalogue number from work.identifier", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: "String Quartet No. 1",
            },
          },
          workList: {
            work: {
              identifier: {
                $: { type: "opus" },
                _: "Op. 18 No. 1",
              },
            },
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/op18_1.mei");

    expect(result).toEqual({
      mei_id: "op18_1",
      title_main: "String Quartet No. 1",
      title_alt: null,
      catalogue_number: "Op. 18 No. 1",
      classification: null,
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("extracts catalogue number from titleStmt titlePart fallback", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: {
                _: "String Quartet No. 1",
                titlePart: [
                  { $: { type: "subordinate" }, _: "Op. 18 No. 1" },
                  {
                    $: { type: "subordinate" },
                    _: "an electronic transcription",
                  },
                ],
              },
            },
          },
          workList: {
            work: {},
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/op18_1.mei");

    expect(result).toEqual({
      mei_id: "op18_1",
      title_main: "String Quartet No. 1",
      title_alt: null,
      catalogue_number: "Op. 18 No. 1",
      classification: null,
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("extracts classification as array from classification termList term", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: "Some Work",
            },
          },
          workList: {
            work: {
              classification: {
                termList: {
                  term: [
                    { _: "Lied", $: { class: "#_4035669-3" } },
                    { _: "Sacred song", $: { class: "#_123" } },
                  ],
                },
              },
            },
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/work_007.mei");

    expect(result).toEqual({
      mei_id: "work_007",
      title_main: "Some Work",
      title_alt: null,
      catalogue_number: null,
      classification: ["Lied", "Sacred song"],
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("returns null classification when no classification exists", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: "Some Work",
            },
          },
          workList: {
            work: {},
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/work_008.mei");

    expect(result).toEqual({
      mei_id: "work_008",
      title_main: "Some Work",
      title_alt: null,
      catalogue_number: null,
      classification: null,
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("uses the first work when workList.work is an array", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: "Preferred Title",
            },
          },
          workList: {
            work: [
              {
                identifier: {
                  $: { type: "opus" },
                  _: "Op. 1",
                },
              },
              {
                identifier: {
                  $: { type: "opus" },
                  _: "Op. 2",
                },
              },
            ],
          },
        },
      },
    };

    const result = getWorkData(meiJson.mei, "/tmp/preferred_work.mei");

    expect(result).toEqual({
      mei_id: "preferred_work",
      title_main: "Preferred Title",
      title_alt: null,
      catalogue_number: "Op. 1",
      classification: null,
      meter_count: null,
      meter_unit: null,
      tempo: null,
      work_key: null,
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null
    });
  });

  test("throws when no work node exists", () => {
    const meiJson = {
      mei: {
        meiHead: {
          fileDesc: {
            titleStmt: {
              title: "Lonely Title",
            },
          },
        },
        music: {},
      },
    };

    expect(() => getWorkData(meiJson.mei, "/tmp/no_work.mei")).toThrow();
  });
  
  test("extracts key, tempo, meter count and meter unit", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              $: { "xml:id": "work_1" },
              title: "Test Work",
              key: {
                _: "F major",
                $: { pname: "f", mode: "major" }
              },
              tempo: "Mässig.",
              meter: {
                $: { count: "3", unit: "4" }
              }
            }
          }
        }
      }
    };

    const result = getWorkData(meiJson.mei,"/tmp/key_tempo_meter_test.mei");

    expect(result.work_key).toBe("F major");
    expect(result.tempo).toBe("Mässig.");
    expect(result.meter_count).toBe(3);
    expect(result.meter_unit).toBe(4);
  });

  test("extracts composition date from text year", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              $: { "xml:id": "work_2" },
              title: "Test Work",
              creation: {
                date: "1785"
              }
            }
          }
        }
      }
    };

    const result = getWorkData(meiJson.mei, "/tmp/text_year_composition_date.mei");

    expect(result.composition_date_text).toBe("1785");
    expect(result.composition_year_start).toBe(1785);
    expect(result.composition_year_end).toBe(1785);
  });

  test("extracts composition date from notbefore and notafter attributes", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              $: { "xml:id": "work_3" },
              title: "Test Work",
              creation: {
                date: {
                  $: {
                    notbefore: "1829",
                    notafter: "1832"
                  }
                }
              }
            }
          }
        }
      }
    };

    const result = getWorkData(meiJson.mei, "/tmp/range_not_before_not_after_composition_date.mei");

    expect(result.composition_date_text).toBe("1829-1832");
    expect(result.composition_year_start).toBe(1829);
    expect(result.composition_year_end).toBe(1832);
  });

  test("extracts key from attributes if key text is missing", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              $: { "xml:id": "work_4" },
              title: "Test Work",
              key: {
                $: { pname: "f", mode: "major" }
              }
            }
          }
        }
      }
    };

    const result = getWorkData(meiJson.mei,"/tmp/missing_attribute_key.mei");

    expect(result.work_key).toBe("f major");
  });

  test("returns null for missing tempo and meter", () => {
    const meiJson = {
      mei: {
        meiHead: {
          workList: {
            work: {
              $: { "xml:id": "work_5" },
              title: "Test Work"
            }
          }
        }
      }
    };

    const result = getWorkData(meiJson.mei,"/tmp/missing_tempo_meter.mei");

    expect(result.tempo).toBeNull();
    expect(result.meter_count).toBeNull();
    expect(result.meter_unit).toBeNull();
  });
});
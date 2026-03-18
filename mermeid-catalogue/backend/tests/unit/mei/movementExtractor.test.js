const { getMovements } = require("../../../src/mei/extractors/movementExtractor");

describe("getMovements", () => {
  test("returns [] when no movement markers exist", () => {
    const mei = {
      mei: {
        music: {
          body: {}
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([]);
  });

  test("extracts movements from multiple workList work entries with xml:id containing movement", () => {
    const mei = {
      meiHead: {
        workList: {
          work: [
            {
              $: { "xml:id": "movement_1", n: "1" },
              title: "Allegro"
            },
            {
              $: { "xml:id": "movement_2", n: "2" },
              title: "Adagio"
            }
          ]
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([
      { position: 1, title: "Allegro" },
      { position: 2, title: "Adagio" }
    ]);
  });

  test("does not treat a single movement work as multi-movement workList pattern", () => {
    const mei = {
      meiHead: {
        workList: {
          work: {
            $: { "xml:id": "movement_1", n: "1" },
            title: "Allegro"
          }
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([]);
  });

  test("extracts movements from multiple mdivs", () => {
    const mei = {
      mei: {
        music: {
          body: {
            mdiv: [
              { $: { n: "1" }, title: "Allegro" },
              { $: { n: "2" }, title: "Adagio" }
            ]
          }
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([
      { position: 1, title: "Allegro" },
      { position: 2, title: "Adagio" }
    ]);
  });

  test("does not treat a single mdiv as multi-movement", () => {
    const mei = {
      mei: {
        music: {
          body: {
            mdiv: {
              $: { n: "1" },
              title: "Only section"
            }
          }
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([]);
  });

  test("extracts movements from work.movement nodes", () => {
    const mei = {
      meiHead: {
        workList: {
          work: {
            title: "Symphony Test",
            movement: [
              { $: { n: "1" }, title: "Allegro" },
              { $: { n: "2" }, title: "Largo" }
            ]
          }
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([
      { position: 1, title: "Allegro" },
      { position: 2, title: "Largo" }
    ]);
  });

  test("extracts movements from work.component nodes", () => {
    const mei = {
      meiHead: {
        workList: {
          work: {
            component: [
              { $: { n: "1" }, title: "Menuetto" },
              { $: { n: "2" }, title: "Finale" }
            ]
          }
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([
      { position: 1, title: "Menuetto" },
      { position: 2, title: "Finale" }
    ]);
  });

  test("falls back to generated title when title is missing", () => {
    const mei = {
      mei: {
        music: {
          body: {
            mdiv: [
              { $: { n: "1" } },
              { $: { n: "2" } }
            ]
          }
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([
      { position: 1, title: "Movement 1" },
      { position: 2, title: "Movement 2" }
    ]);
  });

  test("sorts movements by position", () => {
    const mei = {
      mei: {
        music: {
          body: {
            mdiv: [
              { $: { n: "2" }, title: "Second" },
              { $: { n: "1" }, title: "First" }
            ]
          }
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([
      { position: 1, title: "First" },
      { position: 2, title: "Second" }
    ]);
  });

  test("deduplicates identical movement entries", () => {
    const mei = {
      mei: {
        music: {
          body: {
            mdiv: [
              { $: { n: "1" }, title: "Allegro" },
              { $: { n: "1" }, title: "Allegro" }
            ]
          }
        }
      }
    };

    const result = getMovements(mei);

    expect(result).toEqual([
      { position: 1, title: "Allegro" }
    ]);
  });
});
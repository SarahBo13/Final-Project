const { findWorkNode } = require("../../../src/mei/helpers");

describe("findWorkNode", () => {
  test("returns work from meiHead.workList.work when present", () => {
    const meiRoot = {
      meiHead: {
        workList: {
          work: {
            title: "Symphony No. 1"
          }
        }
      }
    };

    const result = findWorkNode(meiRoot);

    expect(result).toEqual({
      title: "Symphony No. 1"
    });
  });

  test("returns first work when meiHead.workList.work is an array", () => {
    const meiRoot = {
      meiHead: {
        workList: {
          work: [
            { title: "First Work" },
            { title: "Second Work" }
          ]
        }
      }
    };

    const result = findWorkNode(meiRoot);

    expect(result).toEqual({ title: "First Work" });
  });

  test("returns work directly under mei root when meiRoot.work exists", () => {
    const meiRoot = {
      work: {
        title: "Direct Work"
      }
    };

    const result = findWorkNode(meiRoot);

    expect(result).toEqual({
      title: "Direct Work"
    });
  });

  test("returns first work when meiRoot.work is an array", () => {
    const meiRoot = {
      work: [
        { title: "Direct First Work" },
        { title: "Direct Second Work" }
      ]
    };

    const result = findWorkNode(meiRoot);

    expect(result).toEqual({ title: "Direct First Work" });
  });

  test("returns work from meiRoot.workList.work when present", () => {
    const meiRoot = {
      workList: {
        work: {
          title: "Nested WorkList Work"
        }
      }
    };

    const result = findWorkNode(meiRoot);

    expect(result).toEqual({
      title: "Nested WorkList Work"
    });
  });

  test("returns first work when meiRoot.workList.work is an array", () => {
    const meiRoot = {
      workList: {
        work: [
          { title: "Nested First Work" },
          { title: "Nested Second Work" }
        ]
      }
    };

    const result = findWorkNode(meiRoot);

    expect(result).toEqual({ title: "Nested First Work" });
  });

  test("prefers meiHead.workList.work over meiRoot.work", () => {
    const meiRoot = {
      meiHead: {
        workList: {
          work: {
            title: "Preferred Work"
          }
        }
      },
      work: {
        title: "Fallback Work"
      }
    };

    const result = findWorkNode(meiRoot);

    expect(result).toEqual({
      title: "Preferred Work"
    });
  });

  test("prefers meiRoot.work over meiRoot.workList.work when meiHead.workList.work is missing", () => {
    const meiRoot = {
      work: {
        title: "Direct Work"
      },
      workList: {
        work: {
          title: "Lower Priority Work"
        }
      }
    };

    const result = findWorkNode(meiRoot);

    expect(result).toEqual({
      title: "Direct Work"
    });
  });

  test("throws when no work node exists", () => {
    const meiRoot = {
      meiHead: {},
      music: {}
    };

    expect(() => findWorkNode(meiRoot)).toThrow();
  });

  test("throws when meiRoot is null", () => {
    expect(() => findWorkNode(null)).toThrow();
  });

  test("throws when meiRoot is undefined", () => {
    expect(() => findWorkNode(undefined)).toThrow();
  });
});
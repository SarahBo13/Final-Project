const { validateExtractedData } = require("../../../src/validation/validateExtractedData");

describe("validateExtractedData", () => {
  // A fully valid extracted data object used as a baseline
  const validData = {
    work: {
      title_main: "Symphony No. 5",
      title_alt: null,
      genre: "Symphony",
      composition_date: null,
      key_signature: "C minor",
      catalogue_number: "Op. 67",
      mei_id: "work-1"
    },
    persons: [
      {
        name: "Ludwig van Beethoven",
        role: "composer",
        authority_id: null
      }
    ],
    sources: [
      {
        source_type: "bibl",
        repository: null,
        shelfmark: null,
        digital_url: "https://example.com/source",
        notes: "Autograph manuscript"
      }
    ],
    movements: [
      {
        movement_number: "1",
        title: "Allegro con brio",
        tempo: "Allegro con brio",
        key_signature: "C minor"
      }
    ]
  };

  test("does not throw for valid extracted data", () => {
    expect(() => validateExtractedData(validData)).not.toThrow();
  });

  test("does not throw when optional arrays are empty", () => {
    const data = {
      ...validData,
      persons: [],
      sources: [],
      movements: []
    };

    expect(() => validateExtractedData(data)).not.toThrow();
  });

  test("throws when work object is missing", () => {
    const data = {
      ...validData,
      work: null
    };

    expect(() => validateExtractedData(data)).toThrow();
  });

  test("throws when work.title_main is missing", () => {
    const data = {
      ...validData,
      work: {
        ...validData.work,
        title_main: null
      }
    };

    expect(() => validateExtractedData(data)).toThrow();
  });

  test("throws when persons is not an array", () => {
    const data = {
      ...validData,
      persons: null
    };

    expect(() => validateExtractedData(data)).toThrow();
  });

  test("throws when sources is not an array", () => {
    const data = {
      ...validData,
      sources: null
    };

    expect(() => validateExtractedData(data)).toThrow();
  });

  test("throws when movements is not an array", () => {
    const data = {
      ...validData,
      movements: null
    };

    expect(() => validateExtractedData(data)).toThrow();
  });

  test("throws when a person is missing name", () => {
    const data = {
      ...validData,
      persons: [
        {
          name: null,
          role: "composer",
          authority_id: null
        }
      ]
    };

    expect(() => validateExtractedData(data)).toThrow();
  });

  test("throws when a person is missing role", () => {
    const data = {
      ...validData,
      persons: [
        {
          name: "Ludwig van Beethoven",
          role: null,
          authority_id: null
        }
      ]
    };

    expect(() => validateExtractedData(data)).toThrow();
  });

  test("throws when a source is missing source_type", () => {
    const data = {
      ...validData,
      sources: [
        {
          source_type: null,
          repository: null,
          shelfmark: null,
          digital_url: "https://example.com/source",
          notes: "Autograph manuscript"
        }
      ]
    };

    expect(() => validateExtractedData(data)).toThrow();
  });

  test("throws when a movement has no identifying information", () => {
    const data = {
      ...validData,
      movements: [
        {
          movement_number: null,
          title: null,
          tempo: null,
          key_signature: "C minor"
        }
      ]
    };

    expect(() => validateExtractedData(data)).toThrow();
  });
});
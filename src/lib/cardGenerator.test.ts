import { describe, it, expect } from "vitest";
import {
  generateL1Cards,
  generateAllL1Cards,
  generateL2Cards,
  generateAllL2Cards,
  generateL3Cards,
  generateAllL3Cards,
  getCardKey,
  parseCardKey,
} from "./cardGenerator";
import { patternList } from "@/data/patterns";

describe("cardGenerator", () => {
  describe("getCardKey", () => {
    it("should generate card keys with hyphen-separated format", () => {
      const key = getCardKey("circuit-breaker", 1, "definition");
      expect(key).toBe("circuit-breaker-l1-definition");
    });

    it("should generate unique keys for different question types", () => {
      const key1 = getCardKey("retry", 1, "definition");
      const key2 = getCardKey("retry", 1, "problem-identification");
      expect(key1).not.toBe(key2);
    });
  });

  describe("parseCardKey", () => {
    it("should parse valid card keys", () => {
      const parsed = parseCardKey("circuit-breaker-l1-definition");
      expect(parsed).toEqual({
        patternId: "circuit-breaker",
        layer: 1,
        questionType: "definition",
      });
    });

    it("should handle hyphenated pattern IDs", () => {
      const parsed = parseCardKey("cache-aside-l1-problem-identification");
      expect(parsed).toEqual({
        patternId: "cache-aside",
        layer: 1,
        questionType: "problem-identification",
      });
    });

    it("should return null for invalid keys", () => {
      const parsed = parseCardKey("invalid-key");
      expect(parsed).toBeNull();
    });
  });

  describe("generateL1Cards", () => {
    it("should generate exactly 5 cards per pattern", () => {
      const pattern = patternList[0];
      const cards = generateL1Cards(pattern);
      expect(cards).toHaveLength(5);
    });

    it("should generate all 5 question types", () => {
      const pattern = patternList[0];
      const cards = generateL1Cards(pattern);

      const questionTypes = cards.map((c) => c.questionType);
      expect(questionTypes).toContain("definition");
      expect(questionTypes).toContain("problem-identification");
      expect(questionTypes).toContain("pattern-recognition");
      expect(questionTypes).toContain("tradeoff-pros");
      expect(questionTypes).toContain("tradeoff-cons");
    });

    it("should include grammarCoordinates on all cards", () => {
      const pattern = patternList[0];
      const cards = generateL1Cards(pattern);

      cards.forEach((card) => {
        expect(card.grammarCoordinates).toBeDefined();
        expect(card.grammarCoordinates.pattern).toBe(pattern.id);
        expect(card.grammarCoordinates.layer).toBe(1);
        expect(card.grammarCoordinates.domain).toBeTruthy();
        expect(card.grammarCoordinates.facet).toBeTruthy();
        expect(card.grammarCoordinates.questionType).toBeTruthy();
      });
    });

    it("should use correct ID format for all cards", () => {
      const pattern = patternList[0];
      const cards = generateL1Cards(pattern);

      cards.forEach((card) => {
        // Should follow pattern: pattern-id-l1-question-type
        expect(card.id).toMatch(new RegExp(`^${pattern.id}-l1-.+$`));
      });
    });

    it("should set correct difficulty levels", () => {
      const pattern = patternList[0];
      const cards = generateL1Cards(pattern);

      // Definition and problem-identification should have difficulty 1
      const definitionCard = cards.find((c) => c.questionType === "definition");
      const problemCard = cards.find(
        (c) => c.questionType === "problem-identification",
      );
      expect(definitionCard?.difficulty).toBe(1);
      expect(problemCard?.difficulty).toBe(1);

      // Pattern recognition and tradeoffs should have difficulty 2
      const recognitionCard = cards.find(
        (c) => c.questionType === "pattern-recognition",
      );
      const prosCard = cards.find((c) => c.questionType === "tradeoff-pros");
      const consCard = cards.find((c) => c.questionType === "tradeoff-cons");
      expect(recognitionCard?.difficulty).toBe(2);
      expect(prosCard?.difficulty).toBe(2);
      expect(consCard?.difficulty).toBe(2);
    });

    describe("L1DefinitionGenerator", () => {
      it("should generate definition card with correct structure", () => {
        const pattern = patternList[0];
        const cards = generateL1Cards(pattern);
        const defCard = cards.find((c) => c.questionType === "definition");

        expect(defCard).toBeDefined();
        expect(defCard?.sbvpDomain).toBe("structure");
        expect(defCard?.front.text).toContain(pattern.concept.name);
        expect(defCard?.back.text).toBe(pattern.concept.definition);
        expect(defCard?.hints).toContain(pattern.concept.tagline);
        expect(defCard?.grammarCoordinates.facet).toBe("definition");
      });
    });

    describe("L1ProblemIdentificationGenerator", () => {
      it("should generate problem identification card with correct structure", () => {
        const pattern = patternList[0];
        const cards = generateL1Cards(pattern);
        const problemCard = cards.find(
          (c) => c.questionType === "problem-identification",
        );

        expect(problemCard).toBeDefined();
        expect(problemCard?.sbvpDomain).toBe("philosophy");
        expect(problemCard?.front.text).toContain("problem");
        expect(problemCard?.back.text).toBe(pattern.concept.problemSolved);
        if (pattern.philosophy?.coreProblem) {
          expect(problemCard?.hints).toContain(pattern.philosophy.coreProblem);
        }
        expect(problemCard?.grammarCoordinates.facet).toBe("problem");
      });
    });

    describe("L1PatternRecognitionGenerator", () => {
      it("should generate pattern recognition card with correct structure", () => {
        const pattern = patternList[0];
        const cards = generateL1Cards(pattern);
        const recognitionCard = cards.find(
          (c) => c.questionType === "pattern-recognition",
        );

        expect(recognitionCard).toBeDefined();
        expect(recognitionCard?.sbvpDomain).toBe("visualization");
        expect(recognitionCard?.front.text).toBe(pattern.concept.problemSolved);
        expect(recognitionCard?.back.text).toBe(pattern.concept.name);
        expect(recognitionCard?.grammarCoordinates.facet).toBe("recognition");
      });
    });

    describe("L1TradeoffAnalysisGenerator", () => {
      it("should generate tradeoff pros card with correct structure", () => {
        const pattern = patternList[0];
        const cards = generateL1Cards(pattern);
        const prosCard = cards.find((c) => c.questionType === "tradeoff-pros");

        expect(prosCard).toBeDefined();
        expect(prosCard?.sbvpDomain).toBe("philosophy");
        expect(prosCard?.front.text).toContain("advantages");
        expect(prosCard?.back.text).toContain(
          pattern.concept.tradeoffs.pros[0],
        );
        expect(prosCard?.grammarCoordinates.facet).toBe("tradeoffs");
      });

      it("should generate tradeoff cons card with correct structure", () => {
        const pattern = patternList[0];
        const cards = generateL1Cards(pattern);
        const consCard = cards.find((c) => c.questionType === "tradeoff-cons");

        expect(consCard).toBeDefined();
        expect(consCard?.sbvpDomain).toBe("philosophy");
        expect(consCard?.front.text).toContain("drawbacks");
        expect(consCard?.back.text).toContain(
          pattern.concept.tradeoffs.cons[0],
        );
        expect(consCard?.grammarCoordinates.facet).toBe("tradeoffs");
      });
    });
  });

  describe("generateAllL1Cards", () => {
    it("should generate 80 cards for 16 patterns", () => {
      const cards = generateAllL1Cards(patternList);
      expect(cards).toHaveLength(80); // 16 patterns × 5 cards each
    });

    it("should generate cards for all patterns", () => {
      const cards = generateAllL1Cards(patternList);
      const patternIds = new Set(cards.map((c) => c.patternId));

      // All 16 patterns should have cards
      expect(patternIds.size).toBe(16);
      expect(patternIds).toContain("circuit-breaker");
      expect(patternIds).toContain("retry");
      expect(patternIds).toContain("cache-aside");
      expect(patternIds).toContain("rate-limiting");
      expect(patternIds).toContain("bulkhead");
      expect(patternIds).toContain("timeout");
    });

    it("should have unique card IDs", () => {
      const cards = generateAllL1Cards(patternList);
      const ids = cards.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should assign correct SBVP domains", () => {
      const cards = generateAllL1Cards(patternList);

      // Count cards by domain
      const domainCounts = cards.reduce(
        (acc, card) => {
          acc[card.sbvpDomain] = (acc[card.sbvpDomain] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Should have definition cards (structure)
      expect(domainCounts.structure).toBe(16); // 1 per pattern

      // Should have problem and tradeoff cards (philosophy)
      expect(domainCounts.philosophy).toBe(48); // 3 per pattern (problem, pros, cons)

      // Should have recognition cards (visualization)
      expect(domainCounts.visualization).toBe(16); // 1 per pattern
    });

    it("should include all required fields on all cards", () => {
      const cards = generateAllL1Cards(patternList);

      cards.forEach((card) => {
        // Required fields
        expect(card.id).toBeTruthy();
        expect(card.patternId).toBeTruthy();
        expect(card.layer).toBe(1);
        expect(card.questionType).toBeTruthy();
        expect(card.sbvpDomain).toBeTruthy();
        expect(card.front).toBeDefined();
        expect(card.front.text).toBeTruthy();
        expect(card.back).toBeDefined();
        expect(card.back.text).toBeTruthy();
        expect(card.difficulty).toBeGreaterThan(0);
        expect(card.grammarCoordinates).toBeDefined();
      });
    });
  });

  describe("card ID format validation", () => {
    it("should follow spec format: pattern-id-l<layer>-question-type", () => {
      const pattern = patternList[0];
      const cards = generateL1Cards(pattern);

      cards.forEach((card) => {
        const parsed = parseCardKey(card.id);
        expect(parsed).not.toBeNull();
        expect(parsed?.patternId).toBe(pattern.id);
        expect(parsed?.layer).toBe(1);
        expect(parsed?.questionType).toBeTruthy();
      });
    });

    it("should generate deterministic IDs", () => {
      const pattern = patternList[0];
      const cards1 = generateL1Cards(pattern);
      const cards2 = generateL1Cards(pattern);

      cards1.forEach((card, index) => {
        expect(card.id).toBe(cards2[index].id);
      });
    });
  });

  describe("generateL2Cards", () => {
    it("should generate exactly 5 cards per pattern", () => {
      const pattern = patternList[0];
      const cards = generateL2Cards(pattern);
      expect(cards).toHaveLength(5);
    });

    it("should generate correct question types", () => {
      const pattern = patternList[0];
      const cards = generateL2Cards(pattern);

      const questionTypes = cards.map((c) => c.questionType);
      expect(questionTypes).toContain("participants");
      expect(questionTypes).toContain("flow-sequence");
      expect(questionTypes).toContain("participant-role");

      // Should have 3 participant-role cards
      const roleCards = cards.filter(
        (c) => c.questionType === "participant-role",
      );
      expect(roleCards).toHaveLength(3);
    });

    it("should set layer to 2 for all cards", () => {
      const pattern = patternList[0];
      const cards = generateL2Cards(pattern);

      cards.forEach((card) => {
        expect(card.layer).toBe(2);
      });
    });

    it("should use correct ID format for all cards", () => {
      const pattern = patternList[0];
      const cards = generateL2Cards(pattern);

      cards.forEach((card) => {
        expect(card.id).toMatch(new RegExp(`^${pattern.id}-l2-.+$`));
      });
    });

    it("should set difficulty to 2 for all L2 cards", () => {
      const pattern = patternList[0];
      const cards = generateL2Cards(pattern);

      cards.forEach((card) => {
        expect(card.difficulty).toBe(2);
      });
    });

    describe("L2ParticipantsGenerator", () => {
      it("should generate participants card with correct structure", () => {
        const pattern = patternList[0];
        const cards = generateL2Cards(pattern);
        const participantsCard = cards.find(
          (c) => c.questionType === "participants",
        );

        expect(participantsCard).toBeDefined();
        expect(participantsCard?.sbvpDomain).toBe("structure");
        expect(participantsCard?.front.text).toContain("participants");
        expect(participantsCard?.front.text).toContain(pattern.concept.name);
        expect(participantsCard?.back.text).toBeTruthy();
        expect(participantsCard?.back.details).toBeDefined();
        expect(participantsCard?.grammarCoordinates.facet).toBe("participants");
      });
    });

    describe("L2FlowSequenceGenerator", () => {
      it("should generate flow sequence card with correct structure", () => {
        const pattern = patternList[0];
        const cards = generateL2Cards(pattern);
        const flowCard = cards.find((c) => c.questionType === "flow-sequence");

        expect(flowCard).toBeDefined();
        expect(flowCard?.sbvpDomain).toBe("behavior");
        expect(flowCard?.front.text).toContain("sequence");
        expect(flowCard?.front.text).toContain(pattern.concept.name);
        expect(flowCard?.back.text).toBeTruthy();
        expect(flowCard?.grammarCoordinates.facet).toBe("flow");
      });
    });

    describe("L2ParticipantRoleGenerator", () => {
      it("should generate role cards for first 3 participants", () => {
        const pattern = patternList[0];
        const cards = generateL2Cards(pattern);
        const roleCards = cards.filter(
          (c) => c.questionType === "participant-role",
        );

        expect(roleCards).toHaveLength(3);

        roleCards.forEach((card) => {
          expect(card.sbvpDomain).toBe("structure");
          expect(card.front.text).toContain("role");
          expect(card.front.text).toContain(pattern.concept.name);
          expect(card.back.text).toBeTruthy();
          expect(card.grammarCoordinates.facet).toBe("role");
        });
      });

      it("should include responsibilities in card details", () => {
        const pattern = patternList[0];
        const cards = generateL2Cards(pattern);
        const roleCards = cards.filter(
          (c) => c.questionType === "participant-role",
        );

        roleCards.forEach((card) => {
          // Check if details exist (responsibilities may be undefined if not in pattern)
          if (card.back.details) {
            expect(Array.isArray(card.back.details)).toBe(true);
          }
        });
      });
    });
  });

  describe("generateAllL2Cards", () => {
    it("should generate 80 cards for 16 patterns", () => {
      const cards = generateAllL2Cards(patternList);
      expect(cards).toHaveLength(80); // 16 patterns × 5 cards each
    });

    it("should generate cards for all patterns", () => {
      const cards = generateAllL2Cards(patternList);
      const patternIds = new Set(cards.map((c) => c.patternId));

      expect(patternIds.size).toBe(16);
      expect(patternIds).toContain("circuit-breaker");
      expect(patternIds).toContain("retry");
      expect(patternIds).toContain("cache-aside");
      expect(patternIds).toContain("rate-limiting");
      expect(patternIds).toContain("bulkhead");
      expect(patternIds).toContain("timeout");
    });

    it("should have unique card IDs", () => {
      const cards = generateAllL2Cards(patternList);
      const ids = cards.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should assign correct SBVP domains", () => {
      const cards = generateAllL2Cards(patternList);

      const domainCounts = cards.reduce(
        (acc, card) => {
          acc[card.sbvpDomain] = (acc[card.sbvpDomain] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Participants cards: 16 (structure)
      // Role cards: 48 (structure)
      expect(domainCounts.structure).toBe(64);

      // Flow sequence cards: 16 (behavior)
      expect(domainCounts.behavior).toBe(16);
    });

    it("should include all required fields on all cards", () => {
      const cards = generateAllL2Cards(patternList);

      cards.forEach((card) => {
        expect(card.id).toBeTruthy();
        expect(card.patternId).toBeTruthy();
        expect(card.layer).toBe(2);
        expect(card.questionType).toBeTruthy();
        expect(card.sbvpDomain).toBeTruthy();
        expect(card.front).toBeDefined();
        expect(card.front.text).toBeTruthy();
        expect(card.back).toBeDefined();
        expect(card.back.text).toBeTruthy();
        expect(card.difficulty).toBe(2);
        expect(card.grammarCoordinates).toBeDefined();
      });
    });
  });

  describe("generateL3Cards", () => {
    it("should generate exactly 5 cards per pattern", () => {
      const pattern = patternList[0];
      const cards = generateL3Cards(pattern);
      expect(cards).toHaveLength(5);
    });

    it("should generate correct question types", () => {
      const pattern = patternList[0];
      const cards = generateL3Cards(pattern);

      const questionTypes = cards.map((c) => c.questionType);
      expect(questionTypes).toContain("code-identification");
      expect(questionTypes).toContain("action-reason");
      expect(questionTypes).toContain("context-dilation");
      expect(questionTypes).toContain("fill-in-blank");

      // Should have 2 action-reason cards
      const actionReasonCards = cards.filter(
        (c) => c.questionType === "action-reason",
      );
      expect(actionReasonCards).toHaveLength(2);
    });

    it("should set layer to 3 for all cards", () => {
      const pattern = patternList[0];
      const cards = generateL3Cards(pattern);

      cards.forEach((card) => {
        expect(card.layer).toBe(3);
      });
    });

    it("should use correct ID format for all cards", () => {
      const pattern = patternList[0];
      const cards = generateL3Cards(pattern);

      cards.forEach((card) => {
        expect(card.id).toMatch(new RegExp(`^${pattern.id}-l3-.+$`));
      });
    });

    it("should set difficulty to 3 for all L3 cards", () => {
      const pattern = patternList[0];
      const cards = generateL3Cards(pattern);

      cards.forEach((card) => {
        expect(card.difficulty).toBe(3);
      });
    });

    describe("L3CodeIdentificationGenerator", () => {
      it("should generate code identification card with correct structure", () => {
        const pattern = patternList[0];
        const cards = generateL3Cards(pattern);
        const codeIdCard = cards.find(
          (c) => c.questionType === "code-identification",
        );

        expect(codeIdCard).toBeDefined();
        expect(codeIdCard?.sbvpDomain).toBe("structure");
        expect(codeIdCard?.front.text).toContain("Which pattern");
        expect(codeIdCard?.front.text).toContain("```");
        expect(codeIdCard?.back.text).toBe(pattern.concept.name);
        expect(codeIdCard?.grammarCoordinates.facet).toBe("code-recognition");
      });
    });

    describe("L3ActionReasonGenerator", () => {
      it("should generate action-reason cards from annotations", () => {
        const pattern = patternList[0];
        const cards = generateL3Cards(pattern);
        const actionReasonCards = cards.filter(
          (c) => c.questionType === "action-reason",
        );

        expect(actionReasonCards).toHaveLength(2);

        actionReasonCards.forEach((card) => {
          expect(card.sbvpDomain).toBe("behavior");
          expect(card.front.text).toContain("Why");
          expect(card.back.text).toBeTruthy();
          expect(card.grammarCoordinates.facet).toBe("reasoning");
        });
      });
    });

    describe("L3ContextDilationGenerator", () => {
      it("should generate context dilation card", () => {
        const pattern = patternList[0];
        const cards = generateL3Cards(pattern);
        const contextCard = cards.find(
          (c) => c.questionType === "context-dilation",
        );

        expect(contextCard).toBeDefined();
        expect(contextCard?.sbvpDomain).toBe("philosophy");
        expect(contextCard?.front.text).toBeTruthy();
        expect(contextCard?.back.text).toBeTruthy();
        expect(contextCard?.grammarCoordinates.facet).toBe("context");
      });
    });

    describe("L3FillInBlankGenerator", () => {
      it("should generate fill-in-blank card with code snippet", () => {
        const pattern = patternList[0];
        const cards = generateL3Cards(pattern);
        const fillBlankCard = cards.find(
          (c) => c.questionType === "fill-in-blank",
        );

        expect(fillBlankCard).toBeDefined();
        expect(fillBlankCard?.sbvpDomain).toBe("structure");
        expect(fillBlankCard?.front.text).toContain("Complete");
        expect(fillBlankCard?.front.text).toContain("```");
        expect(fillBlankCard?.back.text).toBeTruthy();
        expect(fillBlankCard?.grammarCoordinates.facet).toBe("implementation");
      });
    });
  });

  describe("generateAllL3Cards", () => {
    it("should generate 60 cards for 16 patterns (some without annotations)", () => {
      const cards = generateAllL3Cards(patternList);
      // 6 old patterns with annotations × 5 cards = 30
      // 10 new patterns without annotations × 3 cards = 30
      // Total = 60 cards
      expect(cards).toHaveLength(60);
    });

    it("should generate cards for all patterns", () => {
      const cards = generateAllL3Cards(patternList);
      const patternIds = new Set(cards.map((c) => c.patternId));

      expect(patternIds.size).toBe(16);
      expect(patternIds).toContain("circuit-breaker");
      expect(patternIds).toContain("retry");
      expect(patternIds).toContain("cache-aside");
      expect(patternIds).toContain("rate-limiting");
      expect(patternIds).toContain("bulkhead");
      expect(patternIds).toContain("timeout");
    });

    it("should have unique card IDs", () => {
      const cards = generateAllL3Cards(patternList);
      const ids = cards.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should assign correct SBVP domains", () => {
      const cards = generateAllL3Cards(patternList);

      const domainCounts = cards.reduce(
        (acc, card) => {
          acc[card.sbvpDomain] = (acc[card.sbvpDomain] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Code identification + fill-in-blank: 2 per pattern × 16 = 32 (structure)
      expect(domainCounts.structure).toBe(32);

      // Action-reason cards: only for patterns with annotations (6 patterns × 2 = 12) (behavior)
      expect(domainCounts.behavior).toBe(12);

      // Context dilation: 1 per pattern × 16 = 16 (philosophy)
      expect(domainCounts.philosophy).toBe(16);
    });

    it("should include all required fields on all cards", () => {
      const cards = generateAllL3Cards(patternList);

      cards.forEach((card) => {
        expect(card.id).toBeTruthy();
        expect(card.patternId).toBeTruthy();
        expect(card.layer).toBe(3);
        expect(card.questionType).toBeTruthy();
        expect(card.sbvpDomain).toBeTruthy();
        expect(card.front).toBeDefined();
        expect(card.front.text).toBeTruthy();
        expect(card.back).toBeDefined();
        expect(card.back.text).toBeTruthy();
        expect(card.difficulty).toBe(3);
        expect(card.grammarCoordinates).toBeDefined();
      });
    });
  });

  describe("multi-layer card generation", () => {
    it("should generate 90 total cards (30 per layer)", () => {
      const l1Cards = generateAllL1Cards(patternList);
      const l2Cards = generateAllL2Cards(patternList);
      const l3Cards = generateAllL3Cards(patternList);

      expect(l1Cards).toHaveLength(80);
      expect(l2Cards).toHaveLength(80);
      expect(l3Cards).toHaveLength(60); // 10 new patterns have fewer L3 cards (no annotations)

      const totalCards = l1Cards.length + l2Cards.length + l3Cards.length;
      expect(totalCards).toBe(220); // 80 + 80 + 60
    });

    it("should have unique IDs across all layers", () => {
      const l1Cards = generateAllL1Cards(patternList);
      const l2Cards = generateAllL2Cards(patternList);
      const l3Cards = generateAllL3Cards(patternList);

      const allCards = [...l1Cards, ...l2Cards, ...l3Cards];
      const ids = allCards.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(220); // Total unique cards across all layers
    });
  });
});

import { InternalServerError } from "infra/errors";
import authorization from "models/authorization";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("Throws when without `user`", () => {
      expect(() => {
        authorization.check();
      }).toThrow(InternalServerError);
    });

    test("Throws when without `user.features`", () => {
      const createdUser = {
        username: "newUser",
      };
      expect(() => {
        authorization.check(createdUser);
      }).toThrow(InternalServerError);
    });

    test("Throws when with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };
      expect(() => {
        authorization.check(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("With valid `user` and known `feature`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      expect(authorization.check(createdUser, "read:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("Throws when without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("Throws when without `user.features`", () => {
      const createdUser = {
        username: "newUser",
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("Throws when with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };
      expect(() => {
        authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("Throws when without `originalData`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("With valid `user`, known `feature` and `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      const originalData = {
        id: 1,
        username: "resource",
        email: "resource@curso.dev",
        password: "validpassword",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00:000Z",
        updated_at: "2026-01-01T00:00:00:000Z",
      };

      let result = authorization.filterOutput(
        createdUser,
        "read:user",
        originalData,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00:000Z",
        updated_at: "2026-01-01T00:00:00:000Z",
      });
    });
  });
});

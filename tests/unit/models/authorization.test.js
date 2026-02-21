import { InternalServerError } from "infra/errors";
import authorization from "models/authorization";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("throws when without `user`", () => {
      expect(() => {
        authorization.check();
      }).toThrow(InternalServerError);
    });

    test("throws when without `user.features`", () => {
      const createdUser = {
        username: "newUser"
      };
      expect(() => {
        authorization.check(createdUser);
      }).toThrow(InternalServerError);
    });

    test("throws when with unknown `feature`", () => {
      const createdUser = {
        features: []
      };
      expect(() => {
        authorization.check(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user` and known `feature`", () => {
      const createdUser = {
        features: ["read:user"]
      };

      expect(authorization.check(createdUser, "read:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("throws when without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("throws when without `user.features`", () => {
      const createdUser = {
        username: "newUser"
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("throws when with unknown `feature`", () => {
      const createdUser = {
        features: []
      };
      expect(() => {
        authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("throws when without `originalData`", () => {
      const createdUser = {
        features: ["read:user"]
      };

      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and `resource`", () => {
      const createdUser = {
        features: ["read:user"]
      };

      const originalData = {
        id: 1,
        username: "resource",
        email: "resource@curso.dev",
        password: "validpassword",
        features: ["read:user"],
        created_at: "2026-0101T00:00:00:000Z",
        updated_at: "2026-0101T00:00:00:000Z"
      };

      let result = authorization.filterOutput(
        createdUser,
        "read:user",
        originalData
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-0101T00:00:00:000Z",
        updated_at: "2026-0101T00:00:00:000Z"
      });
    });
  });
});

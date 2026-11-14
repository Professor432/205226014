const { expect } = require("chai");
const jwt = require("jsonwebtoken");
const authenticateUser = require("../middlewares/userAuth.js");

process.env.ACCESS_TOKEN_SECRET = "test-auth-secret";

const createResponse = () => ({
    statusCode: null,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

describe("Customer authentication middleware", () => {
    it("rejects requests without a bearer token", () => {
        const response = createResponse();
        authenticateUser({ headers: {} }, response, () => {
            throw new Error("next should not be called");
        });

        expect(response.statusCode).to.equal(401);
    });

    it("accepts a valid customer token and sets the customer identity", () => {
        const req = {
            headers: {
                authorization: `Bearer ${jwt.sign(
                    { role: "user", user_email: "customer@example.test" },
                    process.env.ACCESS_TOKEN_SECRET
                )}`
            }
        };
        let nextCalled = false;

        authenticateUser(req, createResponse(), () => {
            nextCalled = true;
        });

        expect(nextCalled).to.equal(true);
        expect(req.user.user_email).to.equal("customer@example.test");
    });

    it("rejects tokens that do not represent a customer", () => {
        const response = createResponse();
        const req = {
            headers: {
                authorization: `Bearer ${jwt.sign(
                    { role: "admin", admin_id: "admin-1" },
                    process.env.ACCESS_TOKEN_SECRET
                )}`
            }
        };

        authenticateUser(req, response, () => {
            throw new Error("next should not be called");
        });

        expect(response.statusCode).to.equal(403);
    });
});

const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A user must have a name"],
    },
    photo: { type: String, default: "default.jpg" },
    email: {
        type: String,
        required: [true, "A user must have an email"],
        unique: true,
        lowercase: true,
        validate: {
            validator: function (val) {
                return validator.isEmail(val);
            },
            message: "Please enter a valid email",
        },
    },
    role: {
        type: String,
        enum: ["admin", "lead-guide", "guide", "user"],
        default: "user",
    },
    phone: {
        type: String,
        validate: {
            validator: function (val) {
                return validator.isMobilePhone(val);
            },
            message: "Please enter a valid mobile number",
        },
    },
    password: {
        type: String,
        required: [true, "Please enter a valid password"],
        minLength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm your password"],
        select: false,
        validate: {
            validator: function (val) {
                return val === this.password;
            },
            message: "Passwords are not same",
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

// Save the password after encrypting it
userSchema.pre("save", async function (next) {
    // Only run this function if the password is modified
    if (!this.isModified("password")) return next();

    // Hash the password with the Salt Rounds of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete the passwordConfrim field instead of persisting in DB
    this.passwordConfirm = undefined;

    next();
});

// Update the passwordChangedAt property for user if password is just changed
userSchema.pre("save", function (next) {
    // if password is not modified and document is new, error
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now();
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

// CHECK IF PASSWORD IS CORRECT
userSchema.methods.comparePassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// CHECK IF USER'S PASSWORD WAS CHANGED
userSchema.methods.changedPasswordAfter = function (JWTIssuedAt) {
    if (this.passwordChangedAt) {
        const passChangedAt = this.passwordChangedAt.getTime() / 1000;
        console.log(passChangedAt, JWTIssuedAt);

        // password changed time < token issued time
        // (2025-07-12 < 2025-7-14)
        // True means password was changed, false means not
        return JWTIssuedAt < passChangedAt;
    }

    // false means NOT CHANGED
    return false;
};

userSchema.methods.createPasswordResetToken = async function () {
    // generate the token
    const resetToken = crypto.randomBytes(32).toString("hex");
    // hash the token and store the hashed version in DB
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.passwordResetTokenExpires = Date.now() + 5 * 60 * 1000;

    console.log({ resetToken }, this.passwordResetToken);
    // return the plain reset token
    return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;

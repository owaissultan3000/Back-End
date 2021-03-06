const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  if (req.body.password !== req.body.confirmpassword)
    return res
      .status(400)
      .send({ status: false, message: "Password mis-matched" });
  else {
    await User.findOne({ email: req.body.email }).exec(async (error, user) => {
      if (user) {
        return res.status(400).json({
          message: "User already registered",
        });
      } else {
        const {
          name,
          email,
          phonenumber,
          password,
          address,
          city,
          province,
          country,
          role = "user",
        } = req.body;

        //hashing
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);

        const _user = new User({
          name,
          email,
          phonenumber,
          password: hashed_password,
          address: {
            streetaddress: address,
            city,
            province,
            country,
          },
          role,
        });

        try {
          await _user.save((error, user) => {
            if (error) {
              return res.status(400).json({
                message: "Something went wrong",
              });
            }

            if (user) {
              let token = jwt.sign(
                { _id: user._id, role: user.role },
                `${process.env.TOKEN_SECRET}`,
                { expiresIn: "5h" }
              );
              let data = {
                token: token,
                user: user,
              };
              console.log(data.user);
              return res.status(200).json(data);
            }
          });
        } catch (err) {
          res.status(400).send(err);
        }
      }
    });
  }
};

exports.signin = async (req, res) => {
  await User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (error) return res.status(400).json({ error });

    if (user) {
      const validpassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (validpassword && user.role === "user") {
        const token = jwt.sign(
          { role: user.role },
          `${process.env.TOKEN_SECRET}`,
          { expiresIn: "5h" }
        );
        let data = {
          token: token,
          user: user,
        };

        console.log(data.user);
        return res.json(data);
      } else {
        return res.status(400).json({
          message: "Email or Password is incorrect",
        });
      }
    } else {
      return res.status(400).json({ message: "Something went wrong" });
    }
  });
};

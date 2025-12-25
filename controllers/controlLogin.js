import {db} from "../config/connect_database.js";
import bcrypt from  "bcrypt";
import jwt from "jsonwebtoken";

export const adminsLogin = async  (req, res) => {
    const {email, password} = req.body;
   

    if(!email || !password) return res.status(400).json({message: "All fields are required"});

    try {
        const [row] = await db.query(`SELECT * FROM admins WHERE email = ?`, [email]);
        if(row.length === 0) return res.status(404).json({message: "Admin not found!"});

        const isMatch = await bcrypt.compare(password, row[0].password);
        if(!isMatch) return res.status(400).json({message: "Incorrect password"});

        //check is very_email is pending
        if(row[0].verify_email === "pending") return res.status(400).json({message: "Please verify your email"});

        //sign the jwt token and send it to the user
        const accessToken = jwt.sign({
            userInfo: {
                admin_id: row[0].admin_id,
                name: row[0].name,
                email: row[0].email,
                roles: row[0].role
            }
        }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1d"});

        
       const refreshToken = jwt.sign({
            userInfo: {
                admin_id: row[0].admin_id,
                name: row[0].name,
                email: row[0].email,
                roles: row[0].role
            }
        }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"});
        //store the refreshToken in the database
        await db.query(
            `
            UPDATE admins
            SET refresh_token = ?
            WHERE admin_id = ?
            `,
            [refreshToken, row[0].admin_id]
        );
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({
            message: `Admin ${row[0].name} logged in successfully!`,
            accessToken: accessToken
        }
        );
    } catch (error) {
        return res.status(500).json({error: error?.message});
    }
}

export const customerLogin = async  (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) return res.status(400).json({message: "All fields are required"});

    try {
        const [row] = await db.query(`SELECT * FROM customers WHERE email = ?`, [email]);
        if(row.length === 0) return res.status(404).json({message: "Customer not found!"});

        const isMatch = await bcrypt.compare(password, row[0].password);
        if(!isMatch) return res.status(400).json({message: "Incorrect password"});

        //check is very_email is pending
        if(row[0].verify_email === "pending") return res.status(400).json({message: "Please verify your email"});

        //sign the jwt token and send it to the user
        const accessToken = jwt.sign({
            userInfo: {
                customer_id: row[0].customer_id,
                name: row[0].name,
                email: row[0].email,
                roles: row[0].role
            }
        }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1d"});

        
       const refreshToken = jwt.sign({
            userInfo: {
                customer_id: row[0].customer_id,
                name: row[0].name,
                email: row[0].email,
                roles: row[0].role
            }
        }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"});
        //store the refreshToken in the database
        await db.query(
            `
            UPDATE customers
            SET refresh_token = ?
            WHERE customer_id = ?
            `,
            [refreshToken, row[0].customer_id]
        );
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({
             message: `Customer ${row[0].name} logged in successfully!`,
            accessToken: accessToken
        });
    } catch (error) {
        return res.status(500).json({error: error?.message});
    }
}
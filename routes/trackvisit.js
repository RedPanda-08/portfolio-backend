import express from 'express';
import axios from 'axios';

const router = express.Router();
router.post('/visit',async (req, res) => {
    try{
        await axios.post('https://api.pushover.net/1/messages.json',{
            token:process.env.PUSHOVER_API_TOKEN,
            user:process.env.PUSHOVER_USER_KEY,
            message: "Someone visited your portfolio 😃"
        });
    res.status(200).json({success:true, message:"Notification sent"});
    } catch(error){
        console.error("Error sending notification:", error);
        res.status(500).json({success:false, message:"Failed to send notification"});
    }

});
export default router;
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const fetch = require('node-fetch');
const url=require('url');

const app = express();
const PORT = process.env.PORT||3000;

//启用cors（允许前端访问）
app.use(cors());
app.use(express.json());

//日志中间件 - 记录所有请求
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();

});

//Paddle API 配置
const PADDLE_API_BASE='https://sandbox-api.paddle.com';
const PADDLE_API_KEY=process.env.PADDLE_API_KEY;

//健康检查点
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Sandbox Proxy Server is running',
        timestamp: new Date().toISOString()
    });
});

//代理GET /customers
app.get('/api/paddle/customers',async(req,res)=>{
    try{
        const{email}=req.query;

        if(!email){
            return res.status(400).json({error:'email parameter is required'});
        }

        console.log(`Fetching customer with email: ${email}`);

        const response=await axios.get(`${PADDLE_API_BASE}/customers`,{
            headers:{
                'Authorization':`Bearer ${PADDLE_API_KEY}`,
                'Content-Type':'application/json'
            },
            params:{
                email:email
            }
        });
        console.log(`Paddle API response status:${response.status}`);
        res.json(response.data);
    }catch(error){
        console.error('Error fetching customer:', error.response?.data||error.message);

        //处理404错误：客户不存在
        if(error.response?.status===404){
            //Paddle API返回404表示没有找到客户
            return res.json({data:[]});//返回空数组表示没有客户
        }

        res.status(error.response?.status||500).json({
            error:error.response?.data?.message||'Failed to fetch customer',
            details:error.message
        });
    }
});

//代理POST /customers
app.post('/api/paddle/customers',async(req,res)=>{
    try{
        const{email}=req.body;

        if(!email){
            return res.status(400).json({error:'email is required in request body'});
        }

        console.log(`Creating customer with email:${email}`);

        const response=await axios.post(`${PADDLE_API_BASE}/customers`,{
            email:email
        },{
            headers:{
                'Authorization':`Bearer ${PADDLE_API_KEY}`,
                'Content-Type':'application/json'
            }
        });

        console.log(`Customer created successfully: ${response.data.id}`);
        res.json(response.data);
    }catch(error){
        console.error('Error creating customer:',error.response?.data||error.message);
        res.status(error.response?.status||500).json({
            error:error.response?.data?.message||'Failed to create customer',
            details:error.message
        });
    }
});

//健康检查点
app.get('/health',(req,res)=>{
    res.json({status:'ok',timestamp:new Date().toISOString()});
});

//启动服务器
app.listen(PORT, () => {
    console.log(`\n====================`);
    console.log(`Sandbox proxy server is running`);
    console.log(`Server url:http://localhost:${PORT}`);
    console.log(`Health check:http://localhost:${PORT}/`);
    console.log(`GET /api/paddle/customers?email=xxx`);
    console.log(`POST /api/paddle/customers`);
    console.log(`============================\n`);
});
import axios from "axios";
import {API_URL} from '../config.js';

// const SERVER_HOST = "localhost";
// const SERVER_PORT = 5555;
// const SERVER_SOCKET_ADDRESS = "http://" + SERVER_HOST + ":" + SERVER_PORT + "/";
const SERVER_SOCKET_ADDRESS = API_URL;

const createApi = (resource) => {
    const client = axios.create({
        baseURL: SERVER_SOCKET_ADDRESS + resource
    });
    client.interceptors.request.use((config) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    });
    return client;
};

export const category = createApi("category");
export const restaurantMenu = createApi("menu");
export const cart = createApi("cart");
export const table = createApi("table");
export const cartItems = createApi("cart_items");
export const feedback = createApi("feedback");
export const admin = createApi("admin");
export const users = createApi("users");
export const analysis = createApi("analysis");
export const orders = createApi("orders");
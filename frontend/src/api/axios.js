import axios from 'axios';

const BASE_URL = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';


// public axios
export default axios.create({
    baseURL: BASE_URL,
});

// private axios
export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});
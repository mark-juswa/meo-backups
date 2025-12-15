import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        try {
            const response = await axios.get('/api/auth/refresh', {
                withCredentials: true 
            });

            setAuth(prev => {
                return { 
                    ...prev, 
                    accessToken: response.data.accessToken,
                    role: response.data.user?.role 
                };
            });
            
            return response.data.accessToken;
        } catch (error) {
            console.error('Refresh token error:', error);
            setAuth(null); 
            return Promise.reject(error);
        }
    };
    return refresh;
};

// --- THIS IS ALSO CRITICAL ---
// Make sure this file is also correct and saved.
export default useRefreshToken;
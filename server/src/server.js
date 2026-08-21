import app from './app.js';
import { ENV } from './shared/config/env.js';

const PORT = ENV.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Kiara Medicals Server is running on port ${PORT} [${ENV.NODE_ENV}]`);
  console.log(`📡 Admin Routes: http://localhost:${PORT}/api/admin`);
  console.log(`🏪 Store Routes: http://localhost:${PORT}/api/store`);
});

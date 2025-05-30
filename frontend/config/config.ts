// Configuration de l'environnement
interface EnvironmentConfig {
    API_URL: string;
    // Ajoutez d'autres variables d'environnement ici
  }
  
  // Configuration pour l'environnement de développement
  const dev: EnvironmentConfig = {
    API_URL: 'http://192.168.68.130:3000',
  };
  
  // Configuration pour l'environnement de production
  const prod: EnvironmentConfig = {
    API_URL: 'https://example-api-production.com',
  };
  
  // Sélectionnez la configuration en fonction de l'environnement
  const config = process.env.NODE_ENV === 'production' ? prod : dev;
  
  export default config;
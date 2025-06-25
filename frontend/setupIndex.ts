import 'dotenv/config';
import { azureRagService } from './src/services/azureRagService'; // adjust path if needed
async function setupIndex() {
  try {
    await azureRagService.createSearchIndex();
    console.log('Search index created successfully!');
  } catch (error) {
    console.error('Index creation failed:', error);
  }
}
setupIndex();
console.log('VITE_AZURE_SEARCH_ENDPOINT:', process.env.VITE_AZURE_SEARCH_ENDPOINT);
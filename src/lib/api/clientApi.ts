import { apiClient } from '../apiClient';

export class ClientApi {
  static async getAllClients(): Promise<string[]> {
    try {
      const response = await apiClient.get<{ clients: string[] }>('/api/clients');
      return response.clients;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  static async addClient(name: string): Promise<void> {
    try {
      await apiClient.post('/api/clients', { name });
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  }

  static async clientExists(name: string): Promise<boolean> {
    try {
      const clients = await this.getAllClients();
      return clients.some(c => c.toLowerCase() === name.toLowerCase());
    } catch (error) {
      console.error('Error checking client existence:', error);
      return false;
    }
  }
}

import { supabase } from './supabase';
import { ProjectService } from './projectService';

export class POScheduler {
  static async recalculateAllActivePOs(): Promise<void> {
    try {
      console.log('Starting PO scheduler: Recalculating active POs...');
      
      // Get all projects with PO amendments
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active');
      
      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }
      
      if (!projects || projects.length === 0) {
        console.log('No active projects found');
        return;
      }

      let processedCount = 0;
      let errorCount = 0;

      for (const project of projects) {
        try {
          await ProjectService.recalculateActivePOAmendment(project.id);
          processedCount++;
          console.log(`Recalculated PO for project: ${project.name}`);
        } catch (projectError) {
          errorCount++;
          console.error(`Error recalculating PO for project ${project.name}:`, projectError);
        }
      }
      
      console.log(`PO scheduler completed: ${processedCount} projects processed, ${errorCount} errors`);
    } catch (error) {
      console.error('Error in PO scheduler:', error);
    }
  }

  // Optional: Method to run daily at specific time
  static startDailyScheduler(): NodeJS.Timeout {
    // Run at 12:00 AM every day
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // tomorrow
      0, 0, 0 // 12:00:00 AM
    );
    
    const msUntilMidnight = night.getTime() - now.getTime();
    
    // Initial run after midnight
    const timeout = setTimeout(() => {
      this.recalculateAllActivePOs();
      // Then run every 24 hours
      setInterval(() => this.recalculateAllActivePOs(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    
    return timeout;
  }
}
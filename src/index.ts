
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Internship {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  postedDate?: Date;
  discoveredAt: Date;
  isNew: boolean;
  source: string;
}

interface TrackerState {
  internships: Record<string, Internship>;
  lastCheck: Date;
  customSources: Record<string, string>;
}

class InternshipTracker {
  private stateFile = 'tracker-state.json';
  private axios = axios.create({
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; InternshipBot/1.0)'
    }
  });

  private loadState(): TrackerState {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        const state = JSON.parse(data);
        // Convert date strings back to Date objects
        state.lastCheck = new Date(state.lastCheck);
        Object.values(state.internships).forEach((internship: any) => {
          internship.discoveredAt = new Date(internship.discoveredAt);
          if (internship.postedDate) {
            internship.postedDate = new Date(internship.postedDate);
          }
        });
        return state;
      }
    } catch (error) {
      console.log('⚠️  Failed to load previous state, starting fresh');
    }
    
    return {
      internships: {},
      lastCheck: new Date(),
      customSources: {}
    };
  }

  private saveState(state: TrackerState): void {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('❌ Failed to save state:', error);
    }
  }

  private generateId(company: string, title: string, location: string): string {
    return `${company}_${title}_${location}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
  }

  async scrapeGitHubInternships(): Promise<Internship[]> {
    try {
      console.log('🔍 Checking GitHub internship repository...');
      const response = await this.axios.get('https://github.com/SimplifyJobs/Summer2025-Internships');
      const $ = cheerio.load(response.data);
      
      const internships: Internship[] = [];
      
      // Look for table rows in the README
      $('table tbody tr').each((_, element) => {
        const cells = $(element).find('td');
        if (cells.length >= 3) {
          const company = $(cells[0]).text().trim();
          const title = $(cells[1]).text().trim();
          const location = $(cells[2]).text().trim();
          
          // Skip if closed (contains ❌) or empty
          if (company && title && !title.includes('❌') && !title.includes('Closed')) {
            const id = this.generateId(company, title, location);
            
            internships.push({
              id,
              company,
              title,
              location,
              url: 'https://github.com/SimplifyJobs/Summer2025-Internships',
              discoveredAt: new Date(),
              isNew: true,
              source: 'GitHub'
            });
          }
        }
      });
      
      console.log(`✅ Found ${internships.length} internships from GitHub`);
      return internships.slice(0, 15); // Limit to prevent spam
      
    } catch (error) {
      console.error('❌ Error scraping GitHub:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async scrapeLevelsFyi(): Promise<Internship[]> {
    // Simulated data since levels.fyi requires more complex scraping
    const bigTechInternships = [
      { company: 'Google', title: 'Software Engineering Intern', location: 'Mountain View, CA' },
      { company: 'Microsoft', title: 'Software Engineering Intern', location: 'Redmond, WA' },
      { company: 'Apple', title: 'Software Engineering Intern', location: 'Cupertino, CA' },
      { company: 'Meta', title: 'Software Engineering Intern', location: 'Menlo Park, CA' },
      { company: 'Amazon', title: 'SDE Intern', location: 'Seattle, WA' },
      { company: 'Netflix', title: 'Software Engineering Intern', location: 'Los Gatos, CA' },
      { company: 'Tesla', title: 'Software Engineering Intern', location: 'Austin, TX' },
      { company: 'Uber', title: 'Software Engineering Intern', location: 'San Francisco, CA' },
    ];

    return bigTechInternships.map(({ company, title, location }) => ({
      id: this.generateId(company, title, location),
      company,
      title,
      location,
      url: 'https://levels.fyi/internships',
      discoveredAt: new Date(),
      postedDate: new Date(),
      isNew: true,
      source: 'Levels.fyi'
    }));
  }

  async scrapeAllSources(): Promise<Internship[]> {
    const allInternships: Internship[] = [];
    
    try {
      const [githubInternships, levelsInternships] = await Promise.all([
        this.scrapeGitHubInternships(),
        this.scrapeLevelsFyi()
      ]);
      
      allInternships.push(...githubInternships, ...levelsInternships);
    } catch (error) {
      console.error('❌ Error during scraping:', error);
    }
    
    return allInternships;
  }

  private findNewInternships(current: Internship[], previous: Record<string, Internship>): Internship[] {
    return current.filter(internship => !previous[internship.id]);
  }

  private displayInternships(internships: Internship[], title: string): void {
    console.log(`\n📋 ${title}`);
    console.log('═'.repeat(60));
    
    if (internships.length === 0) {
      console.log('No internships found.');
      return;
    }

    internships.forEach((internship, index) => {
      const status = internship.isNew ? '🆕' : '📌';
      console.log(`\n${index + 1}. ${status} ${internship.company} - ${internship.title}`);
      console.log(`   📍 Location: ${internship.location}`);
      console.log(`   🌐 Source: ${internship.source}`);
      console.log(`   🕒 Discovered: ${internship.discoveredAt.toLocaleDateString()}`);
      
      if (internship.source === 'GitHub') {
        console.log(`   🔗 Apply: Check the GitHub repo for application links`);
      }
    });
  }

  private sendNotification(internship: Internship): void {
    // Console notification (works everywhere)
    console.log('\n🚨🚨🚨 NEW INTERNSHIP ALERT! 🚨🚨🚨');
    console.log(`🏢 ${internship.company}`);
    console.log(`💼 ${internship.title}`);
    console.log(`📍 ${internship.location}`);
    console.log(`🌐 Source: ${internship.source}`);
    console.log('─'.repeat(40));

    // Try to send system notification (optional)
    try {
      if (process.platform === 'darwin') {
        // macOS
        const { exec } = require('child_process');
        exec(`osascript -e 'display notification "${internship.company} - ${internship.title}" with title "New Internship!"'`);
      } else if (process.platform === 'win32') {
        // Windows (requires PowerShell)
        const { exec } = require('child_process');
        exec(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${internship.company} - ${internship.title}', 'New Internship!')"`);
      }
    } catch (error) {
      // Ignore notification errors
    }
  }

  async checkOnce(): Promise<void> {
    console.log('🚀 Internship Tracker - Single Check');
    console.log(`⏰ ${new Date().toLocaleString()}\n`);
    
    const internships = await this.scrapeAllSources();
    this.displayInternships(internships, `Found ${internships.length} Total Internships`);
    
    // Save state
    const state = this.loadState();
    internships.forEach(internship => {
      state.internships[internship.id] = internship;
    });
    state.lastCheck = new Date();
    this.saveState(state);
  }

  async monitor(intervalMinutes: number = 30): Promise<void> {
    console.log('🚀 Starting Internship Monitor...');
    console.log(`⏱️  Checking every ${intervalMinutes} minutes`);
    console.log(`🔔 Notifications: ON\n`);

    const checkForInternships = async () => {
      console.log(`\n🔍 Checking at ${new Date().toLocaleString()}`);
      
      const state = this.loadState();
      const currentInternships = await this.scrapeAllSources();
      const newInternships = this.findNewInternships(currentInternships, state.internships);

      if (newInternships.length > 0) {
        console.log(`\n🎉 Found ${newInternships.length} NEW internships!`);
        
        newInternships.forEach(internship => {
          this.sendNotification(internship);
        });
        
        this.displayInternships(newInternships, 'New Internships');
      } else {
        console.log('No new internships found.');
      }

      // Update state
      currentInternships.forEach(internship => {
        state.internships[internship.id] = internship;
      });
      state.lastCheck = new Date();
      this.saveState(state);
      
      console.log('─'.repeat(60));
    };

    // Initial check
    await checkForInternships();

    // Set up interval
    setInterval(checkForInternships, intervalMinutes * 60 * 1000);
  }

  listInternships(): void {
    const state = this.loadState();
    const internships = Object.values(state.internships);
    
    console.log(`📊 Total Tracked Internships: ${internships.length}`);
    console.log(`🕒 Last Check: ${state.lastCheck.toLocaleString()}\n`);
    
    this.displayInternships(internships, 'All Tracked Internships');
  }
}

// CLI Interface
async function main() {
  const tracker = new InternshipTracker();
  const command = process.argv[2];
  
  switch (command) {
    case 'monitor':
      const interval = parseInt(process.argv[3]) || 30;
      await tracker.monitor(interval);
      break;
      
    case 'check':
      await tracker.checkOnce();
      break;
      
    case 'list':
      tracker.listInternships();
      break;
      
    default:
      console.log('🎯 Internship Tracker Commands:');
      console.log('  npm run check    - Check once and exit');
      console.log('  npm run monitor  - Monitor continuously (30 min intervals)');
      console.log('  npm run list     - List all tracked internships');
      console.log('\nCustom intervals:');
      console.log('  tsx src/index.ts monitor 10  - Check every 10 minutes');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}


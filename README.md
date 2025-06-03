# Internship Tracker 🎯

An automated tool to track and monitor internship opportunities from various sources including GitHub and major tech companies.

## Features ✨

- 🔍 Scrapes internship listings from multiple sources:
  - GitHub's Summer 2025 Internships repository
  - Major tech companies (simulated data)
- ⏰ Configurable monitoring intervals
- 🔔 Desktop notifications for new opportunities
- 💾 Maintains state between runs
- 📋 Easy-to-use CLI interface

## Prerequisites 📋

- Node.js (v14 or higher)
- npm or yarn
- TypeScript

## Installation 🚀

1. Clone the repository:
```bash
git clone https://github.com/Jesterkori/Internship-scraper.git
cd internship-tracker
```

2. Install dependencies:
```bash
npm install
```

## Usage 💻

### Available Commands

```bash
# Check once for internships
npm run check

# Monitor continuously (default: 30 min intervals)
npm run monitor

# List all tracked internships
npm run list

# Custom monitoring interval (e.g., 10 minutes)
tsx src/index.ts monitor 10
```

## Project Structure 📁

```
internship-tracker/
├── src/
│   └── index.ts        # Main application code
├── package.json        # Project dependencies
├── tsconfig.json      # TypeScript configuration
└── README.md         # Project documentation
```

## Dependencies 📦

- `axios`: HTTP client for making requests
- `cheerio`: HTML parsing and scraping
- `typescript`: Type support
- `tsx`: TypeScript execution

## Features in Detail 🔍

- **Automated Scraping**: Regularly checks multiple sources for new internship postings
- **Deduplication**: Prevents duplicate listings using unique ID generation
- **Desktop Notifications**: System notifications for new opportunities
- **State Management**: Saves progress between runs
- **Configurable Intervals**: Customize checking frequency

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments 🙏

- [SimplifyJobs/Summer2025-Internships](https://github.com/SimplifyJobs/Summer2025-Internships) for internship data
- Various tech company career pages

## Disclaimer ⚠️

This tool is for educational purposes only. Please respect the terms of service and robots.txt files of any websites you scrape.

---
Made with ❤️ by [Jesterkori](https://github.com/Jesterkori)

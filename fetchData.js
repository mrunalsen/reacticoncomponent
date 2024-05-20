// Import node-fetch dynamically
console.log('Script started.');
const path = require('path');
const fs = require('fs');

// Icons page index
const page = 0;
// Icons per page
const perPage = 10000;

import('node-fetch').then(async (fetchModule) => {
    console.log('Starting to fetch......');
    const fetch = fetchModule.default;

    // Function to fetch project data from the API
    async function fetchProjects() {
        console.log('Fetching Projects');
        try {
            // PROJECTS fetch API
            const response = await fetch('http://172.16.1.169:8080/api/project/search?Page=0&PerPage=50&sort=-projectId', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any required headers (e.g., authentication token)
                },
                // Add any necessary request body
            });
            const data = await response.json();
            // console.log(data?.result?.projects);
            return data.result.projects;
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    }
    // Function to sanitize file names
    function sanitizeFileName(name) {
        return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
    // Function to fetch SVGs for multiple projects
    async function fetchAndWriteSVGs(projects) {
        console.log('Fetching Icons');
        try {
            // ICONS project wise API
            for (const project of projects) {
                const response = await fetch(`http://172.16.1.169:8080/api/project/${project.projectId}/icons?page=${page}&perPage=${perPage}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add any required headers (e.g., authentication token)
                    },
                    // Add any necessary request body
                    body: JSON.stringify({ "categoryId": null, "styleId": null }),
                });

                const iconData = await response.json();
                console.log('icon Data : ', iconData);
                // if (iconData && iconData.result && iconData.result.icons) {
                //     iconData.result.icons.forEach(async icon => {
                //         if (icon.iconImages && icon.iconImages.length > 0) {
                //             for (const image of icon.iconImages) {
                //                 const svgData = await fetchSVGData(image.iconImagePath);
                //                 const outputPath = path.resolve(__dirname, 'src/assets', image.imageName);
                //                 // Write SVG data to file
                //                 fs.writeFileSync(outputPath, svgData);
                //             }
                //         }
                //     });
                // }
                if (iconData && iconData.result && iconData.result.icons) {
                    const projectDir = path.resolve(__dirname, 'src/assets', project.projectName);
                    if (!fs.existsSync(projectDir)) {
                        fs.mkdirSync(projectDir, { recursive: true });
                    }

                    for (const icon of iconData.result.icons) {
                        if (icon.iconImages && icon.iconImages.length > 0) {
                            for (const image of icon.iconImages) {
                                if (path.extname(image.iconImagePath).toLowerCase() === '.svg') {
                                    const svgData = await fetchSVGData(image.iconImagePath);
                                    const sanitizedIconName = sanitizeFileName(icon.iconName);
                                    const outputPath = path.resolve(projectDir, `${sanitizedIconName}.svg`);
                                    // Write SVG data to file
                                    fs.writeFileSync(outputPath, svgData);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching and writing SVGs:', error);
        }
    }

    // Function to fetch SVG data from URL
    async function fetchSVGData(url) {
        console.log('fetching svg Data');
        try {
            // Construct full URL
            const fullUrl = `http://172.16.1.169:8080/${url}`;
            const response = await fetch(fullUrl);
            // Convert response to text
            const svgData = await response.text();
            console.log('fetched SVGs');
            return svgData;
        } catch (error) {
            console.error('Error fetching SVG data:', error);
            // Return empty string on error
            return '';
        }
    }


    // Fetch projects and fetch SVGs for each project
    async function fetchAndWriteSVGsForAllProjects() {
        console.log('writing SVGs');
        const projects = await fetchProjects();
        await fetchAndWriteSVGs(projects);
    }

    // Call the function to fetch and write SVGs for all projects
    fetchAndWriteSVGsForAllProjects();

}).catch(error => {
    console.error('Error importing node-fetch:', error);
});
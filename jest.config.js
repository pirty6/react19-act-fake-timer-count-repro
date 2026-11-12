const sharedProject = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/*.test.js']
};

module.exports = {
  projects: [
    {
      ...sharedProject,
      displayName: 'react19'
    },
    {
      ...sharedProject,
      displayName: 'react18',
      moduleNameMapper: {
        '^react$': 'react-18',
        '^react/(.*)$': 'react-18/$1',
        '^react-dom$': 'react-dom-18',
        '^react-dom/(.*)$': 'react-dom-18/$1'
      }
    }
  ]
};

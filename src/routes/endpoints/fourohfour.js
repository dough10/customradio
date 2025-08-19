/**
 * Express handler for 404 errors, logs request details, saves to collection, 
 * and redirects to a Rickroll for certain paths.
 *
 * @async
 * @function
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @throws {Error} If there is an error while saving to the collection or logging.
 */
module.exports = async (req, res) => {
  try {
    const requestedPath = decodeURIComponent(req.originalUrl);
    
    /**
     * Array of sensitive paths that will trigger a redirect to a Rickroll if detected.
     * @type {string[]}
     */
    const sensitivePaths = ['.env', 'wp-admin', '.git', '.ssh', '.json', '.yml', '.sql'];
    for (const path of sensitivePaths) {
      if (requestedPath.includes(path)) {
        // Rickroll
        return res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      }
    }
  
    res.status(404).send();
  } catch(e) {
    res.status(404).send();
  }
};
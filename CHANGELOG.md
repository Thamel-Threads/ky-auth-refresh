# Changelog

## [1.1.0] - 2024-09-13

### 🚀 Performance Improvements
- **40% smaller package size** - Reduced from 10.6KB to 6.3KB unpacked
- **21% smaller tarball** - Reduced from 3.3KB to 2.6KB compressed
- **Advanced minification** - Aggressive esbuild optimization
- **Removed source maps** - Eliminated .map files for smaller package

### 🧹 Code Cleanup
- **Removed JSDoc comments** - Cleaner, more compact code
- **Simplified error messages** - Shorter, more concise error text
- **Optimized TypeScript types** - Reduced type definition size by 79%
- **Streamlined function logic** - More compact implementation

### 📦 Package Optimization
- **Enhanced .npmignore** - Excludes unnecessary files from package
- **Optimized tsup config** - Better minification settings
- **Removed example files** - Cleaner package structure
- **Improved tree shaking** - Better ESM optimization

### ✅ Quality Assurance
- **All tests passing** - 8/8 tests successful
- **TypeScript compliance** - Full type safety maintained
- **Backward compatibility** - No breaking changes
- **Production ready** - Optimized for real-world usage

---

## [1.0.1] - 2024-09-13

### 🐛 Bug Fixes
- Fixed URL handling in retry requests
- Improved error handling for edge cases
- Enhanced TypeScript type definitions

### ✨ Features
- Added `skipAuthRefresh` option
- Custom retry logic with `onRetry` callback
- Request queuing to prevent duplicate refresh calls

---

## [1.0.0] - 2024-09-13

### 🎉 Initial Release
- Automatic token refresh for Ky HTTP client
- Support for custom status codes
- TypeScript support
- Minimal API design

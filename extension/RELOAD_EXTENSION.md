# How to Reload the Extension

After updating the code, you need to reload the extension in Chrome:

## Quick Steps

1. **Open Chrome Extensions Page**
   - Go to: `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in top-right corner (if not already on)

3. **Find Your Extension**
   - Look for "LinkedIn Profile Analyzer" or your extension name

4. **Click Reload Button**
   - Click the circular reload icon (🔄) on your extension card
   - Or click "Remove" and then "Load unpacked" to reload from folder

5. **Verify Update**
   - Go to any LinkedIn profile
   - Open browser console (F12)
   - Click "Deep Analysis"
   - You should see new messages:
     ```
     🔄 Expanding all sections...
     ✓ Clicking: Show all activity
     ✅ Clicked X expand buttons
     📜 Scrolling to load content...
     ✅ All sections expanded and loaded
     ```

## Alternative: Full Reinstall

If reload doesn't work:

1. Go to `chrome://extensions/`
2. Click "Remove" on your extension
3. Click "Load unpacked"
4. Select the `extension` folder: `D:\course\extension`
5. Extension will be reinstalled with new code

## Testing

After reload, test on a profile with 10+ posts:

1. Go to a LinkedIn profile with many posts
2. Click extension icon
3. Click "Deep Analysis"
4. Watch console for expansion messages
5. Wait 8-12 seconds for completion
6. Click "Export Data"
7. Check JSON file - should have more posts!

## Troubleshooting

### Extension not updating?
- Try full reinstall instead of reload
- Clear browser cache
- Restart Chrome

### Still only 2-3 posts?
- Check console for error messages
- LinkedIn might have changed their HTML
- Try manually clicking "Show all activity" first

### Scraping takes too long?
- Normal! Expansion takes 8-12 seconds
- Be patient, it's collecting more data
- Don't close tab during scraping

## Success Indicators

✅ Console shows expansion messages
✅ Scraping takes 8-12 seconds (longer than before)
✅ JSON file has 10-50 posts (not just 2-3)
✅ More complete experience/education data
✅ Better analysis results

Done! Your extension is now updated with auto-expansion. 🎉

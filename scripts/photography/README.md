# RAW File Deduplication Scanner

Finds duplicate RAW files (ARW, DNG, etc.) using file hashing. Designed to run efficiently on Synology NAS.

## Features

- ✅ Finds true duplicates using SHA256 file hashing (not just filename matching)
- ✅ Handles large file collections (~10,000+ files)
- ✅ Low resource usage - won't impact other NAS operations
- ✅ Progress tracking with ETA
- ✅ Generates reports in CSV or JSON format
- ✅ Safe - never deletes files automatically

## Supported Formats

ARW (Sony), DNG, RAW, CR2 (Canon), NEF (Nikon), ORF (Olympus), RW2 (Panasonic), PEF (Pentax), SRW (Samsung)

## Installation on Synology NAS

### 1. Enable SSH on your Synology
- Control Panel → Terminal & SNMP → Enable SSH service

### 2. Install Python3 (if not already installed)
- Package Center → Search "Python" → Install Python 3

### 3. Upload the script
```bash
# From your computer, copy the script to NAS
scp deduplicate_raws.py admin@your-nas-ip:/volume1/homes/admin/
```

Or use File Station to upload to your home directory.

## Usage

### Running on Synology NAS (Recommended)

```bash
# SSH into your NAS
ssh admin@your-nas-ip

# Navigate to script location
cd /volume1/homes/admin/

# Run with low priority (won't interfere with other operations)
nice -n 19 python3 deduplicate_raws.py /volume1/photos --output /volume1/reports/duplicates.csv
```

**Typical paths on Synology:**
- Photos: `/volume1/photo` or `/volume1/homes/username/photos`
- Output: `/volume1/reports/` (create this folder first)

### Running from Your Computer

If your NAS is mounted as a network drive:

```bash
# macOS/Linux
python deduplicate_raws.py /Volumes/NAS/photos --output ~/Desktop/duplicates.csv

# Windows (adjust drive letter)
python deduplicate_raws.py Z:\photos --output duplicates.csv
```

### Advanced Options

```bash
# Generate JSON report instead of CSV
python deduplicate_raws.py /volume1/photos --output report.json --format json

# Add custom RAW extensions
python deduplicate_raws.py /volume1/photos --output report.csv --extensions .raf,.x3f
```

## Output

### CSV Format
```
Hash,File_Count,Total_Size_MB,File_Paths
a1b2c3d4...,3,45.2,/path/file1.arw | /path/file2.arw | /path/file3.arw
```

### JSON Format
```json
{
  "scan_date": "2025-10-23T14:30:00",
  "total_duplicate_sets": 15,
  "total_duplicate_files": 42,
  "duplicates": [
    {
      "hash": "a1b2c3d4...",
      "count": 3,
      "size_mb": 45.2,
      "files": ["/path/file1.arw", "/path/file2.arw", "/path/file3.arw"]
    }
  ]
}
```

## Performance

- **10,000 files**: ~15-30 minutes (depends on file sizes and NAS performance)
- **CPU usage**: Low (nice priority)
- **Memory**: Minimal (~50-100MB)
- **Disk I/O**: Read-only, sequential

## Scheduling on Synology (Optional)

To run automatically:

1. Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script
2. General tab: Name it "RAW Deduplication"
3. Schedule tab: Choose when to run (e.g., weekly at 2am)
4. Task Settings tab:
   ```bash
   nice -n 19 python3 /volume1/homes/admin/deduplicate_raws.py /volume1/photos --output /volume1/reports/duplicates_$(date +\%Y\%m\%d).csv
   ```

## What to Do With Results

The script **NEVER deletes files** - it only reports duplicates.

After reviewing the report:
1. Open the CSV/JSON to see which files are duplicates
2. Manually verify the duplicates (check file paths)
3. Delete the unwanted copies yourself
4. Keep at least one copy of each unique file!

## Troubleshooting

**"Permission denied"**
```bash
chmod +x deduplicate_raws.py
```

**"Python not found"**
- Install Python 3 from Synology Package Center

**Script runs slow**
- This is normal for large collections
- Low priority ensures it doesn't impact other tasks
- Let it run overnight if needed

## Safety Notes

- ✅ Read-only operation - never modifies files
- ✅ Uses file hashing - finds true duplicates, not just name matches
- ✅ Generates report for review before any action
- ⚠️ Always verify duplicates before deleting
- ⚠️ Keep backups before removing any files

## Example Workflow

```bash
# 1. SSH to NAS
ssh admin@192.168.1.100

# 2. Create reports directory
mkdir -p /volume1/reports

# 3. Run scan (will take 15-30 min for 10k files)
nice -n 19 python3 deduplicate_raws.py /volume1/photos --output /volume1/reports/duplicates.csv

# 4. Download report to your computer
# (use File Station or scp)

# 5. Review and decide what to delete
# (manual process - never automated!)
```

---

**Need help?** Check the main README or ask Claude!

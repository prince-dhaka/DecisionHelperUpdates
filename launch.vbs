Set WshShell = CreateObject("WScript.Shell")
currentDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
batPath = currentDir & "\DecisionHelper.bat"
WshShell.Run "cmd.exe /c """ & batPath & """", 0, False

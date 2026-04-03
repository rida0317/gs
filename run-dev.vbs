' Run School Management System in Development Mode (Hidden Window)
' © 2026 Mohamed Reda Nahlaoui
' This script runs the batch file without showing the CMD window

On Error Resume Next

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
strScriptPath = WScript.ScriptFullName
strScriptDir = objFSO.GetParentFolderName(strScriptPath)

' Check if batch file exists
strBatchFile = strScriptDir & "\run-dev-hidden.bat"
If Not objFSO.FileExists(strBatchFile) Then
    MsgBox "Error: run-dev-hidden.bat not found!" & vbCrLf & vbCrLf & _
           "Path: " & strBatchFile, vbCritical, "File Not Found"
    WScript.Quit 1
End If

' Run the batch file hidden (0 = hidden, false = don't wait)
intReturn = objShell.Run("""" & strBatchFile & """", 0, False)

If Err.Number <> 0 Then
    MsgBox "Error starting application:" & vbCrLf & Err.Description, vbCritical, "Error"
    WScript.Quit 1
End If

' Success - just exit silently
WScript.Quit 0

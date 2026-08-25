' VBScript to create Desktop Icon for Overlay Asmaro
Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
Set oShortcut = WshShell.CreateShortcut(strDesktop & "\Overlay Asmaro.lnk")
oShortcut.TargetPath = WshShell.CurrentDirectory & "\Start_Overlay_Asmaro.bat"
oShortcut.WorkingDirectory = WshShell.CurrentDirectory
oShortcut.Description = "Overlay Asmaro - متجر الألعاب والسكربتات"
oShortcut.Save

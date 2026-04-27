import React from 'react';

export default function PersonalHomepage() {
  // 使用醒目的样式确保能看到
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff0000',
        color: '#ffffff',
        fontSize: '48px',
        fontWeight: 'bold',
        zIndex: 999999
      }}
    >
      个人主页测试 - 如果能看到这段文字说明渲染正常
    </div>
  );
}

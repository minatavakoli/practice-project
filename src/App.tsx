import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import RegisterForm from './component/form'
import {Box} from '@chakra-ui/react' 

function App() {

  return (
    <Box>
      <RegisterForm/>
    </Box>
  )
}

export default App
